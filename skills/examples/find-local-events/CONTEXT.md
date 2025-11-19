# Find Local Events - User Context

<!--
PERSONALIZATION REQUIRED
========================
This file contains GENERIC PLACEHOLDER CONTEXT for the find-local-events skill.
You MUST customize this file with the actual user's preferences, location, and interests.

DO NOT use this generic context as-is. Replace all sections below with real user information.

How to personalize:
1. Replace location with user's actual city/region
2. Update timezone to user's actual timezone
3. Customize event preferences based on user's real interests
4. Add any specific accessibility or budget requirements
5. Remove this comment block after personalization
-->

## User Location & Timezone

**Default Location**: Seattle, WA

<!-- REPLACE with user's actual home city or preferred search location -->

**Timezone**: America/Los_Angeles (PST/PDT)

<!-- REPLACE with user's actual timezone from IANA timezone database -->

**Notes**:

- When no location is specified, default to Seattle, WA
- Use Pacific timezone for all date/time calculations unless otherwise specified
- User travels frequently - always confirm location for event searches

<!-- UPDATE notes to reflect user's actual location habits -->

## Event Preferences

### Highly Interested In

The user frequently enjoys these types of events:

- **Live Music**: Indie rock, jazz, folk, singer-songwriter
- **Technology**: Tech meetups, hackathons, developer conferences
- **Food & Drink**: Food festivals, wine tastings, brewery events
- **Arts & Culture**: Art gallery openings, museum exhibitions, theater
- **Outdoor Activities**: Hiking meetups, outdoor concerts, farmers markets

<!-- REPLACE with user's actual interests and preferences -->

### Sometimes Interested In

The user occasionally attends:

- Comedy shows
- Sports events (especially soccer)
- Book readings and author talks
- Film festivals and screenings

<!-- REPLACE with user's occasional interests -->

### Not Interested In

Generally avoid recommending:

- Children's events (user has no kids)
- Nightclubs/EDM shows
- Extremely crowded events

<!-- REPLACE with event types user wants to avoid -->

## Preferences & Constraints

### Budget

- Prefers free or low-cost events (<$30)
- Willing to pay more ($50+) for exceptional concerts or performances
- Always show ticket prices in results

<!-- CUSTOMIZE based on user's actual budget preferences -->

### Accessibility

- No specific accessibility requirements
- Prefers venues with good public transit access
- Parking availability is a plus but not required

<!-- UPDATE with any real accessibility needs or transportation preferences -->

### Social Context

- Usually attends events solo or with 1-2 friends
- Open to meetups and group events
- Interested in networking opportunities at tech events

<!-- REPLACE with user's actual social event preferences -->

### Timing Preferences

- Weeknight events: Prefer 6:00 PM - 9:00 PM start times
- Weekend events: Flexible timing
- Avoid events that run past 11:00 PM on weeknights

<!-- CUSTOMIZE based on user's actual schedule preferences -->

## Past Event Interests

<!--
TRACK USER'S HISTORY
====================
As you help the user find events, track what they show interest in.
This section should be updated regularly based on:
- Events user asks about
- Types of events user attends
- Feedback about recommendations

Keep this section current to improve future recommendations.
-->

### Recent Searches

- Jazz concerts in Seattle (March 2024)
- Tech meetups in San Francisco (February 2024)
- Food festivals in Portland, OR (January 2024)

<!-- REPLACE with actual user search history -->

### Attended Events

- Seattle Symphony - Beethoven Series (February 2024)
- React Conf 2024 (January 2024)
- Pike Place Market Winter Festival (December 2023)

<!-- TRACK events user actually attended or indicated strong interest in -->

### Favorites

- Annual Seattle Folk Festival
- Pacific Northwest Tech Summit
- Local brewery anniversary events

<!-- BUILD this list based on events user mentions repeatedly or attends regularly -->

## Special Considerations

### Dietary Restrictions

- Vegetarian
- No specific allergies

<!-- REPLACE with user's actual dietary needs, important for food events -->

### Interests by Season

- **Spring/Summer**: Outdoor concerts, festivals, farmers markets
- **Fall**: Theater season, tech conferences, harvest festivals
- **Winter**: Indoor concerts, holiday markets, museum events

<!-- CUSTOMIZE based on how user's interests shift seasonally -->

### Neighborhoods/Venues

**Preferred Areas** (Seattle):

- Capitol Hill
- Ballard
- Fremont
- Downtown/Pioneer Square

**Favorite Venues**:

- The Crocodile
- Neumos
- Benaroya Hall
- SIFF Cinema

<!-- REPLACE with user's actual preferred neighborhoods and venues in their city -->

## Usage Notes for Agent

When using this context:

1. **Always verify current location**: User may be traveling
2. **Confirm dates explicitly**: Don't assume "this weekend" - calculate and confirm
3. **Prioritize listed interests**: Use "Highly Interested In" for primary filtering
4. **Respect constraints**: Always check budget and timing preferences
5. **Update this file**: After each event search session, consider updating preferences based on user feedback
6. **Ask when uncertain**: If user's request conflicts with stated preferences, ask for clarification

## Personalization Quality Checklist

Before using this skill, ensure CONTEXT.md has been personalized:

- [ ] Default location updated to user's actual city
- [ ] Timezone reflects user's actual timezone
- [ ] Event preferences reflect real user interests (not generic examples)
- [ ] Budget and accessibility constraints are accurate
- [ ] Past events section has been started (will grow over time)
- [ ] Dietary restrictions and special considerations are noted
- [ ] This checklist and placeholder comment have been removed

---

**Last Updated**: [INSERT DATE]
**Personalized For**: [INSERT USER NAME/IDENTIFIER]

<!-- Remove these placeholders and add actual information -->
