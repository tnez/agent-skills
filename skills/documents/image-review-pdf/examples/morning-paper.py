#!/usr/bin/env python3
"""
Morning Paper Generator - Example of Composable Workflow

This example demonstrates how to use the image-review-pdf lib modules
to create a personalized "morning paper" PDF that combines:
- Daily tasks from a todo list
- Inbox screenshots for review
- Calendar preview
- Project status

This showcases the composability of the lib/ modules for building
custom workflows.
"""

import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak

from lib.pdf_components import (
    add_screenshot_section,
    create_title_page,
    get_default_styles,
)


def create_morning_paper(
    output_file: Path,
    inbox_dir: Path = None,
    tasks: list = None,
    calendar_events: list = None
):
    """
    Generate a personalized morning paper PDF.

    Args:
        output_file: Where to save the PDF
        inbox_dir: Directory containing inbox screenshots
        tasks: List of task strings
        calendar_events: List of calendar event strings
    """
    # Create PDF document
    doc = SimpleDocTemplate(
        str(output_file),
        pagesize=letter,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch,
    )

    story = []
    styles = get_default_styles()

    # === TITLE PAGE ===
    today = datetime.now()
    title_elements = create_title_page(
        title="Morning Review",
        subtitle=today.strftime("%A, %B %d, %Y"),
        metadata={
            "Tasks": len(tasks) if tasks else 0,
            "Inbox Items": len(list(inbox_dir.glob("*.png"))) if inbox_dir and inbox_dir.exists() else 0,
            "Calendar Events": len(calendar_events) if calendar_events else 0,
        },
        styles=styles
    )
    story.extend(title_elements)
    story.append(PageBreak())

    # === SECTION 1: TODAY'S TASKS ===
    story.append(Paragraph("Today's Tasks", styles['title']))
    story.append(Spacer(1, 12))

    if tasks:
        for task in tasks:
            story.append(Paragraph(f"• {task}", styles['subtitle']))
            story.append(Spacer(1, 6))
    else:
        story.append(Paragraph("<i>No tasks for today</i>", styles['metadata']))

    story.append(Spacer(1, 0.5*inch))

    # === SECTION 2: CALENDAR PREVIEW ===
    story.append(Paragraph("Today's Calendar", styles['title']))
    story.append(Spacer(1, 12))

    if calendar_events:
        for event in calendar_events:
            story.append(Paragraph(f"• {event}", styles['subtitle']))
            story.append(Spacer(1, 6))
    else:
        story.append(Paragraph("<i>No events scheduled</i>", styles['metadata']))

    story.append(PageBreak())

    # === SECTION 3: INBOX REVIEW ===
    if inbox_dir and inbox_dir.exists():
        inbox_images = sorted(inbox_dir.glob("*.png"))

        if inbox_images:
            # Add inbox section with screenshots
            add_screenshot_section(
                story=story,
                screenshots=inbox_images,
                section_title="Inbox Review - Items Requiring Action",
                max_width=5*inch,  # Smaller thumbnails for inbox items
                annotation_height=120,  # Space for notes on each item
                screenshots_per_page=1,  # One item per page for detailed review
                show_filenames=True,
                styles=styles
            )

    # Build the PDF
    doc.build(story)
    print(f"✓ Morning paper created: {output_file}")


def main():
    """Example usage of the morning paper generator."""

    # Example data (in a real workflow, this would come from APIs, databases, etc.)
    tasks = [
        "Review pull request #234",
        "Prepare presentation slides",
        "Team standup at 10:00 AM",
        "Code review session at 2:00 PM",
        "Update project documentation",
    ]

    calendar_events = [
        "10:00 AM - Team Standup (30 min)",
        "11:30 AM - 1:1 with Manager (45 min)",
        "2:00 PM - Code Review Session (60 min)",
        "4:00 PM - Planning Meeting (60 min)",
    ]

    # Paths (adjust these for your environment)
    inbox_dir = Path.home() / "Desktop" / "inbox-screenshots"
    output_file = Path.home() / "Desktop" / f"morning-paper-{datetime.now().strftime('%Y-%m-%d')}.pdf"

    # Generate the morning paper
    create_morning_paper(
        output_file=output_file,
        inbox_dir=inbox_dir,
        tasks=tasks,
        calendar_events=calendar_events
    )


if __name__ == "__main__":
    main()
