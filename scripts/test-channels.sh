#!/bin/bash
set -e

# Channel Integration Tests
# Tests the channel CLI commands outside-in, like a user would

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEST_DIR="$PROJECT_ROOT/.test-channels"
CLI="node $PROJECT_ROOT/dist/cli/index.js"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

cleanup() {
  rm -rf "$TEST_DIR"
}

setup() {
  cleanup
  mkdir -p "$TEST_DIR/.agents"
  cd "$TEST_DIR"
}

# Test helpers
pass() { echo -e "${GREEN}✓${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }

assert_contains() {
  if echo "$1" | grep -q "$2"; then
    return 0
  else
    echo -e "${RED}Expected output to contain:${NC} '$2'"
    echo -e "${YELLOW}Actual output:${NC}"
    echo "$1"
    return 1
  fi
}

assert_file_exists() {
  [[ -f "$1" ]] || { echo -e "${RED}Expected file to exist:${NC} $1"; return 1; }
}

assert_dir_exists() {
  [[ -d "$1" ]] || { echo -e "${RED}Expected directory to exist:${NC} $1"; return 1; }
}

assert_file_contains() {
  if grep -q "$2" "$1"; then
    return 0
  else
    echo -e "${RED}Expected file $1 to contain:${NC} '$2'"
    echo -e "${YELLOW}Actual content:${NC}"
    cat "$1"
    return 1
  fi
}

extract_message_id() {
  echo "$1" | grep "Message ID:" | sed 's/.*Message ID: //'
}

extract_reply_id() {
  echo "$1" | grep "Reply ID:" | sed 's/.*Reply ID: //'
}

# Trap cleanup on exit
trap cleanup EXIT

echo "=== Channel Integration Tests ==="
echo ""

setup

# -----------------------------------------------------------------------------
# Happy Path Tests
# -----------------------------------------------------------------------------

# Test 1: Publish creates structure
echo "Test 1: Publish creates structure"
output=$($CLI channels publish "#test" "hello world" --from "test-user" 2>&1)
assert_contains "$output" "Published to #test" || fail "Publish should succeed"

# Verify directory structure
assert_dir_exists "$TEST_DIR/.agents/channels/#test" || fail "Channel directory should exist"
assert_file_exists "$TEST_DIR/.agents/channels/#test/_metadata.yaml" || fail "Metadata file should exist"

# Find the message directory (timestamp-based)
msg_dir=$(find "$TEST_DIR/.agents/channels/#test" -mindepth 1 -maxdepth 1 -type d ! -name '_*' | head -1)
[[ -n "$msg_dir" ]] || fail "Message directory should exist"
assert_file_exists "$msg_dir/message.md" || fail "message.md should exist"
assert_file_contains "$msg_dir/message.md" "hello world" || fail "Message content should be present"

MESSAGE_ID=$(extract_message_id "$output")
[[ -n "$MESSAGE_ID" ]] || fail "Should capture message ID"

pass "Publish creates correct structure"

# Test 2: Read shows message
echo "Test 2: Read shows message"
output=$($CLI channels read "#test" 2>&1)
assert_contains "$output" "hello world" || fail "Read should show message content"
assert_contains "$output" "test-user" || fail "Read should show sender"

pass "Read shows message"

# Test 3: Reply creates thread
echo "Test 3: Reply creates thread"
output=$($CLI channels reply "#test" "$MESSAGE_ID" "this is a reply" --from "replier" 2>&1)
assert_contains "$output" "Replied in #test" || fail "Reply should succeed"

REPLY_ID=$(extract_reply_id "$output")
[[ -n "$REPLY_ID" ]] || fail "Should capture reply ID"

# Verify reply file exists
assert_file_exists "$TEST_DIR/.agents/channels/#test/$MESSAGE_ID/$REPLY_ID.md" || fail "Reply file should exist"
assert_file_contains "$TEST_DIR/.agents/channels/#test/$MESSAGE_ID/$REPLY_ID.md" "this is a reply" || fail "Reply content should be present"

pass "Reply creates thread"

# Test 4: List shows channel
echo "Test 4: List shows channel"
output=$($CLI channels list 2>&1)
assert_contains "$output" "#test" || fail "List should show channel"
assert_contains "$output" "test-user" || fail "List should show creator"

pass "List shows channel"

# Test 5: Time filtering
echo "Test 5: Time filtering"

# Publish another message for filtering test
$CLI channels publish "#test" "recent message" --from "test-user" >/dev/null 2>&1

# Read with --since should include recent messages
output=$($CLI channels read "#test" --since 1h 2>&1)
assert_contains "$output" "recent message" || fail "Since filter should show recent messages"

pass "Time filtering works"

# Test 6: DM channel
echo "Test 6: DM channel"
output=$($CLI channels publish "@user--test" "dm message" --from "sender" 2>&1)
assert_contains "$output" "Published to @user--test" || fail "DM publish should succeed"
assert_dir_exists "$TEST_DIR/.agents/channels/@user--test" || fail "DM channel directory should exist"

output=$($CLI channels read "@user--test" 2>&1)
assert_contains "$output" "dm message" || fail "DM read should show message"

pass "DM channel works"

# -----------------------------------------------------------------------------
# Edge Case Tests
# -----------------------------------------------------------------------------

# Test 7: Missing channels read
echo "Test 7: Missing channels read"
output=$($CLI channels read "#nonexistent" 2>&1)
assert_contains "$output" "No messages" || fail "Missing channel should handle gracefully"

pass "Missing channel handled gracefully"

# Test 8: Invalid reply
echo "Test 8: Invalid reply to non-existent message"
output=$($CLI channels reply "#test" "invalid-message-id" "orphan reply" 2>&1) || true
assert_contains "$output" "not found" || assert_contains "$output" "Error" || fail "Invalid reply should show error"

pass "Invalid reply handled gracefully"

# Test 9: Empty channels read (channel exists but no messages)
echo "Test 9: List with no channels"
cleanup
setup

output=$($CLI channels list 2>&1)
assert_contains "$output" "No channels" || fail "Empty list should indicate no channels"

pass "Empty list handled gracefully"

# Test 10: Read with reply count shown
echo "Test 10: Read shows reply count"
$CLI channels publish "#replies" "parent message" --from "user" >/dev/null 2>&1
parent_output=$($CLI channels read "#replies" 2>&1)
PARENT_ID=$(echo "$parent_output" | grep "ID:" | head -1 | sed 's/.*ID: //')

$CLI channels reply "#replies" "$PARENT_ID" "reply 1" --from "user" >/dev/null 2>&1
$CLI channels reply "#replies" "$PARENT_ID" "reply 2" --from "user" >/dev/null 2>&1

output=$($CLI channels read "#replies" 2>&1)
assert_contains "$output" "2 replies" || fail "Read should show reply count"

pass "Read shows reply count"

# Test 11: Multiple channels list
echo "Test 11: Multiple channels list"
$CLI channels publish "#alpha" "msg" >/dev/null 2>&1
$CLI channels publish "#beta" "msg" >/dev/null 2>&1
$CLI channels publish "#gamma" "msg" >/dev/null 2>&1

output=$($CLI channels list 2>&1)
assert_contains "$output" "#alpha" || fail "List should show alpha"
assert_contains "$output" "#beta" || fail "List should show beta"
assert_contains "$output" "#gamma" || fail "List should show gamma"

pass "Multiple channels listed"

# Test 12: Message with tags
echo "Test 12: Message with tags"
$CLI channels publish "#tagged" "tagged message" --from "user" --tags "tag1,tag2" >/dev/null 2>&1
msg_file=$(find "$TEST_DIR/.agents/channels/#tagged" -name "message.md" | head -1)
assert_file_contains "$msg_file" "tag1" || fail "Tags should be in frontmatter"

pass "Message with tags"

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------

echo ""
echo -e "${GREEN}=== All tests passed! ===${NC}"
