"""
Image processing utilities for thumbnails and PDF optimization.

Provides composable functions for resizing, optimizing, and preparing
images (and video frames) for embedding in PDFs or other documents.
"""

from pathlib import Path
from typing import Tuple, Optional, Dict, Any
import tempfile
import subprocess
import sys

try:
    from PIL import Image
except ImportError:
    raise ImportError("Pillow is required. Install with: pip install Pillow")


def _check_ffmpeg() -> bool:
    """Check if ffmpeg is available for video processing."""
    try:
        subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True,
            check=True
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


class ImageProcessor:
    """Handle image processing operations for PDF generation."""

    @staticmethod
    def create_thumbnail(
        image_path: Path,
        max_width: Optional[int] = None,
        max_height: Optional[int] = None,
        maintain_aspect: bool = True,
        quality: int = 85
    ) -> Tuple[Image.Image, int, int]:
        """
        Create a thumbnail from an image.

        Args:
            image_path: Path to source image
            max_width: Maximum width in pixels (None = no limit)
            max_height: Maximum height in pixels (None = no limit)
            maintain_aspect: Whether to maintain aspect ratio
            quality: JPEG quality for output (1-100)

        Returns:
            Tuple of (PIL Image, final_width, final_height)

        Example:
            >>> img, w, h = ImageProcessor.create_thumbnail(
            ...     Path("screenshot.png"),
            ...     max_width=800
            ... )
        """
        img = Image.open(image_path)
        original_width, original_height = img.size

        # Calculate new dimensions
        new_width = original_width
        new_height = original_height

        if maintain_aspect:
            # Calculate scaling based on constraints
            width_scale = max_width / original_width if max_width else 1.0
            height_scale = max_height / original_height if max_height else 1.0

            # Use the smaller scale to ensure we don't exceed either dimension
            if max_width and max_height:
                scale = min(width_scale, height_scale)
            elif max_width:
                scale = width_scale
            elif max_height:
                scale = height_scale
            else:
                scale = 1.0

            # Only scale down, never up
            if scale < 1.0:
                new_width = int(original_width * scale)
                new_height = int(original_height * scale)
        else:
            # Non-aspect ratio preserving
            if max_width:
                new_width = max_width
            if max_height:
                new_height = max_height

        # Resize if dimensions changed
        if (new_width, new_height) != (original_width, original_height):
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

        return img, new_width, new_height

    @staticmethod
    def optimize_for_pdf(
        img: Image.Image,
        format: str = "JPEG",
        quality: int = 85
    ) -> Image.Image:
        """
        Optimize image for PDF embedding.

        Converts to RGB mode if needed and applies compression.

        Args:
            img: PIL Image to optimize
            format: Output format (JPEG, PNG)
            quality: Compression quality (1-100)

        Returns:
            Optimized PIL Image

        Example:
            >>> img = Image.open("screenshot.png")
            >>> optimized = ImageProcessor.optimize_for_pdf(img)
        """
        # Convert RGBA to RGB for JPEG
        if format.upper() == "JPEG" and img.mode in ("RGBA", "LA", "P"):
            # Create white background
            background = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            background.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
            img = background
        elif img.mode != "RGB" and format.upper() == "JPEG":
            img = img.convert("RGB")

        return img

    @staticmethod
    def extract_video_frame(
        video_path: Path,
        timestamp: str = "00:00:01",
        output_format: str = "png"
    ) -> Optional[Path]:
        """
        Extract a frame from a video file as a thumbnail.

        Requires ffmpeg to be installed.

        Args:
            video_path: Path to video file
            timestamp: Timestamp to extract (format: HH:MM:SS or seconds)
            output_format: Output image format (png, jpg)

        Returns:
            Path to extracted frame, or None if failed

        Example:
            >>> frame = ImageProcessor.extract_video_frame(
            ...     Path("recording.mp4"),
            ...     timestamp="00:00:05"
            ... )
            >>> if frame:
            ...     img, w, h = ImageProcessor.create_thumbnail(frame, max_width=800)
        """
        if not _check_ffmpeg():
            print("Warning: ffmpeg not found. Video thumbnails require ffmpeg.", file=sys.stderr)
            return None

        try:
            # Create temp file for frame
            temp = tempfile.NamedTemporaryFile(
                suffix=f'.{output_format}',
                delete=False
            )
            temp_path = Path(temp.name)
            temp.close()

            # Extract frame using ffmpeg
            cmd = [
                "ffmpeg",
                "-ss", timestamp,
                "-i", str(video_path),
                "-vframes", "1",
                "-q:v", "2",  # High quality
                "-y",  # Overwrite
                str(temp_path)
            ]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True
            )

            if result.returncode == 0 and temp_path.exists():
                return temp_path
            else:
                return None

        except Exception as e:
            print(f"Error extracting video frame: {e}", file=sys.stderr)
            return None

    @staticmethod
    def is_video_file(file_path: Path) -> bool:
        """
        Check if a file is a video file.

        Args:
            file_path: Path to file

        Returns:
            True if file is a video, False otherwise
        """
        video_extensions = {
            '.mp4', '.mov', '.avi', '.mkv', '.webm',
            '.flv', '.m4v', '.wmv', '.mpg', '.mpeg'
        }
        return file_path.suffix.lower() in video_extensions

    @staticmethod
    def get_image_info(image_path: Path) -> Dict[str, Any]:
        """
        Get information about an image file.

        Args:
            image_path: Path to image file

        Returns:
            Dictionary with image metadata

        Example:
            >>> info = ImageProcessor.get_image_info(Path("screenshot.png"))
            >>> print(f"Size: {info['width']}x{info['height']}")
        """
        img = Image.open(image_path)
        return {
            'width': img.width,
            'height': img.height,
            'format': img.format,
            'mode': img.mode,
            'size_bytes': image_path.stat().st_size,
            'aspect_ratio': img.width / img.height if img.height > 0 else 0,
        }


# Convenience functions for direct use

def create_thumbnail(
    image_path: Path,
    max_width: Optional[int] = None,
    max_height: Optional[int] = None,
    **kwargs
) -> Tuple[Image.Image, int, int]:
    """
    Convenience function to create a thumbnail.

    See ImageProcessor.create_thumbnail for full documentation.

    Example:
        >>> img, w, h = create_thumbnail(Path("screenshot.png"), max_width=800)
    """
    return ImageProcessor.create_thumbnail(image_path, max_width, max_height, **kwargs)


def optimize_for_pdf(img: Image.Image, **kwargs) -> Image.Image:
    """
    Convenience function to optimize image for PDF.

    See ImageProcessor.optimize_for_pdf for full documentation.

    Example:
        >>> img = Image.open("screenshot.png")
        >>> optimized = optimize_for_pdf(img)
    """
    return ImageProcessor.optimize_for_pdf(img, **kwargs)


def get_image_info(image_path: Path) -> Dict[str, Any]:
    """
    Convenience function to get image information.

    See ImageProcessor.get_image_info for full documentation.

    Example:
        >>> info = get_image_info(Path("screenshot.png"))
        >>> print(f"Dimensions: {info['width']}x{info['height']}")
    """
    return ImageProcessor.get_image_info(image_path)
