import React from "react";

// Helper function to format duration in minutes to "X hours Y minutes"
export const formatDuration = (totalMinutes: number | undefined): string => {
  if (totalMinutes === undefined || totalMinutes < 0) return "N/A";
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  let result = "";
  if (hours > 0) {
    result += `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  if (minutes > 0) {
    if (hours > 0) result += " ";
    result += `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  
  return result.trim() || "0 minutes";
};

// Helper function to render text with URLs as hyperlinks
export const renderPrerequisitesWithLinks = (text: string | null | undefined): React.ReactNode => {
  if (!text) return null;
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={index} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-500 hover:underline"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};
