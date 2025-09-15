import { describe, it, expect } from "vitest";
import { formatPreviewText, formatNotePreview } from "./notePreviewFormatter";

describe("notePreviewFormatter", () => {
  describe("HTML stripping", () => {
    it("should strip HTML tags and convert to plain text", () => {
      const htmlContent =
        "<p>This is a <strong>bold</strong> text with <em>italic</em> content.</p>";
      const result = formatPreviewText(htmlContent, 100);
      expect(result).toBe("This is a bold text with italic content.");
    });

    it("should convert HTML lists to markdown-style lists", () => {
      const htmlContent =
        "<ul><li>First item</li><li>Second item</li><li>Third item</li></ul>";
      const result = formatPreviewText(htmlContent, 100);
      expect(result).toContain("• First item");
      expect(result).toContain("• Second item");
      expect(result).toContain("• Third item");
      // Check that items are on separate lines
      expect(result).toMatch(/• First item\n• Second item\n• Third item/);
    });

    it("should convert HTML numbered lists to numbered lists", () => {
      const htmlContent =
        "<ol><li>First step</li><li>Second step</li><li>Third step</li></ol>";
      const result = formatPreviewText(htmlContent, 100);
      expect(result).toContain("1. First step");
      expect(result).toContain("2. Second step");
      expect(result).toContain("3. Third step");
      // Check that items are on separate lines
      expect(result).toMatch(/1\. First step\n2\. Second step\n3\. Third step/);
    });

    it("should handle mixed content with lists and text", () => {
      const htmlContent =
        "<p>Introduction text</p><ul><li>Item 1</li><li>Item 2</li></ul><p>Conclusion text</p>";
      const result = formatPreviewText(htmlContent, 100);
      expect(result).toContain("Introduction text");
      expect(result).toContain("• Item 1");
      expect(result).toContain("• Item 2");
      expect(result).toContain("Conclusion text");
    });

    it("should handle HTML entities", () => {
      const htmlContent =
        "<p>Text with &amp; entities &lt; and &gt; symbols</p>";
      const result = formatPreviewText(htmlContent, 100);
      expect(result).toBe("Text with & entities < and > symbols");
    });

    it("should truncate long content with ellipsis", () => {
      const longContent = "<p>" + "A".repeat(200) + "</p>";
      const result = formatPreviewText(longContent, 50);
      expect(result).toHaveLength(53); // 50 + '...'
      expect(result.endsWith("...")).toBe(true);
    });
  });

  describe("formatNotePreview", () => {
    it("should detect bullet lists correctly", () => {
      const content = "• First item\n• Second item\n• Third item";
      const result = formatNotePreview(content, 100);
      expect(result.type).toBe("bullet");
      expect(result.preview).toContain("• First item");
    });

    it("should detect numbered lists correctly", () => {
      const content = "1. First step\n2. Second step\n3. Third step";
      const result = formatNotePreview(content, 100);
      expect(result.type).toBe("numbered");
      expect(result.preview).toContain("1. First step");
    });

    it("should detect mixed content", () => {
      const content = "• Bullet item\n1. Numbered item\n• Another bullet";
      const result = formatNotePreview(content, 100);
      expect(result.type).toBe("mixed");
      expect(result.hasMultipleTypes).toBe(true);
    });

    it("should handle plain text", () => {
      const content = "This is just plain text without any lists.";
      const result = formatNotePreview(content, 100);
      expect(result.type).toBe("text");
      expect(result.preview).toBe("This is just plain text without any lists.");
    });
  });
});
