/**
 * Utility functions for formatting note content previews with list markers
 */

export interface PreviewFormatting {
  type: "bullet" | "numbered" | "mixed" | "text";
  preview: string;
  hasMultipleTypes: boolean;
}

/**
 * Strips HTML tags and converts HTML entities to plain text
 * Also converts HTML lists to markdown-style lists for better preview formatting
 */
function stripHtml(html: string): string {
  if (!html) return "";

  // Create a temporary DOM element to parse HTML
  if (typeof document !== "undefined") {
    const temp = document.createElement("div");
    temp.innerHTML = html;

    // Convert HTML lists to markdown-style lists
    const ulElements = temp.querySelectorAll("ul");
    ulElements.forEach((ul) => {
      const listItems = ul.querySelectorAll("li");
      const listText = Array.from(listItems)
        .map((li) => {
          const text = li.textContent || "";
          return `• ${text}`;
        })
        .join("\n");
      ul.textContent = listText;
    });

    const olElements = temp.querySelectorAll("ol");
    olElements.forEach((ol) => {
      const listItems = ol.querySelectorAll("li");
      const listText = Array.from(listItems)
        .map((li, index) => {
          const text = li.textContent || "";
          return `${index + 1}. ${text}`;
        })
        .join("\n");
      ol.textContent = listText;
    });

    // Get the text content and clean up extra whitespace
    const textContent = temp.textContent || temp.innerText || "";
    return textContent
      .replace(/\n\s*\n/g, "\n") // Remove extra blank lines
      .trim(); // Remove leading/trailing whitespace
  }

  // Fallback for server-side rendering or when document is not available
  let plainText = html
    .replace(/<ul[^>]*>/gi, "") // Remove ul tags
    .replace(/<\/ul>/gi, "\n") // Convert closing ul tags to newlines
    .replace(/<ol[^>]*>/gi, "") // Remove ol tags
    .replace(/<\/ol>/gi, "\n") // Convert closing ol tags to newlines
    .replace(/<li[^>]*>/gi, "• ") // Convert li tags to bullet points
    .replace(/<\/li>/gi, "\n") // Convert closing li tags to newlines
    .replace(/<[^>]*>/g, "") // Remove remaining HTML tags
    .replace(/&nbsp;/g, " ") // Replace &nbsp; with space
    .replace(/&amp;/g, "&") // Replace &amp; with &
    .replace(/&lt;/g, "<") // Replace &lt; with <
    .replace(/&gt;/g, ">") // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#39;/g, "'") // Replace &#39; with '
    .replace(/&apos;/g, "'") // Replace &apos; with '
    .replace(/\n\s*\n/g, "\n") // Remove extra blank lines
    .trim(); // Remove leading/trailing whitespace

  return plainText;
}

/**
 * Detects list formatting in note content and returns appropriate preview
 */
export function formatNotePreview(
  content: string,
  maxLength: number = 100
): PreviewFormatting {
  if (!content || content.trim().length === 0) {
    return {
      type: "text",
      preview: "",
      hasMultipleTypes: false,
    };
  }

  // Strip HTML tags and convert to plain text
  const plainText = stripHtml(content);

  const lines = plainText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return {
      type: "text",
      preview: "",
      hasMultipleTypes: false,
    };
  }

  let bulletCount = 0;
  let numberedCount = 0;
  let textCount = 0;
  const detectedTypes = new Set<string>();

  // Analyze each line to detect formatting
  lines.forEach((line) => {
    // Check for bullet points (-, *, +)
    if (/^[-*+]\s/.test(line)) {
      bulletCount++;
      detectedTypes.add("bullet");
    }
    // Check for numbered lists (1., 2., etc.)
    else if (/^\d+\.\s/.test(line)) {
      numberedCount++;
      detectedTypes.add("numbered");
    }
    // Check for other list formats (•, ◦, ▪, etc.)
    else if (/^[•◦▪▫]\s/.test(line)) {
      bulletCount++;
      detectedTypes.add("bullet");
    } else {
      textCount++;
      detectedTypes.add("text");
    }
  });

  const hasMultipleTypes = detectedTypes.size > 1;
  const totalListItems = bulletCount + numberedCount;

  // Determine the primary format type
  let primaryType: "bullet" | "numbered" | "mixed" | "text";

  if (hasMultipleTypes && totalListItems > 0) {
    primaryType = "mixed";
  } else if (bulletCount > numberedCount) {
    primaryType = "bullet";
  } else if (numberedCount > 0) {
    primaryType = "numbered";
  } else {
    primaryType = "text";
  }

  // Generate preview based on detected format
  let preview = "";

  if (primaryType === "bullet" || primaryType === "mixed") {
    // Show bullet points with • marker
    const bulletLines = lines
      .filter((line) => /^[-*+•◦▪▫]\s/.test(line) || /^\d+\.\s/.test(line))
      .slice(0, 3); // Show up to 3 list items

    preview = bulletLines
      .map((line) => {
        // Convert various bullet formats to •
        const cleanLine = line.replace(/^[-*+•◦▪▫]\s/, "• ");
        return cleanLine;
      })
      .join("\n");
  } else if (primaryType === "numbered") {
    // Show numbered list
    const numberedLines = lines
      .filter((line) => /^\d+\.\s/.test(line))
      .slice(0, 3);
    preview = numberedLines.join("\n");
  } else {
    // Show plain text preview
    preview = content;
  }

  // Truncate if too long
  if (preview.length > maxLength) {
    preview = preview.substring(0, maxLength).trim() + "...";
  }

  return {
    type: primaryType,
    preview,
    hasMultipleTypes,
  };
}

/**
 * Gets the appropriate list marker for display
 */
export function getListMarker(formatting: PreviewFormatting): string {
  switch (formatting.type) {
    case "bullet":
      return "•";
    case "numbered":
      return "1.";
    case "mixed":
      return "•";
    case "text":
    default:
      return "";
  }
}

/**
 * Formats the preview text with proper line breaks and markers
 */
export function formatPreviewText(
  content: string,
  maxLength: number = 100
): string {
  // Strip HTML tags first
  const plainText = stripHtml(content);
  const formatting = formatNotePreview(plainText, maxLength);

  if (formatting.type === "text" || !formatting.preview) {
    return plainText.length > maxLength
      ? plainText.substring(0, maxLength) + "..."
      : plainText;
  }

  return formatting.preview;
}
