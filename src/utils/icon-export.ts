import React from 'react';
import { createRoot } from 'react-dom/client';
import { 
  CiPlay1, 
  CiPause1, 
  CiStop1, 
} from "react-icons/ci";
import {
  AiFillDelete,
  AiOutlineEdit
} from "react-icons/ai";
import { CgRename } from "react-icons/cg";
import { IoPerson, IoPersonOutline } from "react-icons/io5";
import { FaTools } from "react-icons/fa";
import { RiAiGenerate } from "react-icons/ri";
import { GoArrowLeft, GoArrowRight, GoArrowUp } from "react-icons/go";
import { PiEnvelopeThin } from "react-icons/pi";

// Icon mapping for export
const icons = {
  // Timeline controls
  'play': CiPlay1,
  'pause': CiPause1,
  'stop': CiStop1,
  
  // Track controls
  'delete': AiFillDelete,
  'edit': AiOutlineEdit,
  'rename': CgRename,
  'person': IoPerson,
  'person-outline': IoPersonOutline,
  'tools': FaTools,
  'ai-generate': RiAiGenerate,
  
  // Navigation
  'arrow-left': GoArrowLeft,
  'arrow-right': GoArrowRight,
  'arrow-up': GoArrowUp,
  
  // Processing
  'envelope': PiEnvelopeThin
};

// Function to get SVG string from React Icon
function getIconSVG(IconComponent: React.ComponentType<any>, size = 24): Promise<string> {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    const root = createRoot(container);
    
    // Create a temporary component to render the icon
    const TempComponent = () => React.createElement(IconComponent, { 
      size,
      onLoad: () => {
        const svgElement = container.querySelector('svg');
        if (svgElement) {
          const svgString = svgElement.outerHTML;
          resolve(svgString);
          root.unmount();
          document.body.removeChild(container);
        }
      }
    });
    
    root.render(React.createElement(TempComponent));
    
    // Fallback timeout
    setTimeout(() => {
      const svgElement = container.querySelector('svg');
      if (svgElement) {
        const svgString = svgElement.outerHTML;
        resolve(svgString);
        root.unmount();
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
      }
    }, 100);
  });
}

// Function to export all icons as SVG files
export async function exportIconsToSVG() {
  const exports: { [key: string]: string } = {};
  
  for (const [name, IconComponent] of Object.entries(icons)) {
    try {
      const svgString = await getIconSVG(IconComponent, 24);
      exports[name] = svgString;
      console.log(`Exported ${name}.svg`);
    } catch (error) {
      console.error(`Failed to export ${name}:`, error);
    }
  }
  
  return exports;
}

// Function to generate markdown with icons
export function generateIconMarkdown() {
  let markdown = '# CMG Application Icons\n\n';
  
  Object.entries(icons).forEach(([iconName, IconComponent]) => {
    markdown += `## ${iconName}\n`;
    markdown += `![${iconName}](./images/icons/${iconName}.svg)\n\n`;
    markdown += `\`\`\`typescript\n`;
    markdown += `import { ${IconComponent.name} } from "react-icons/...";\n`;
    markdown += `<${IconComponent.name} size={24} />\n`;
    markdown += `\`\`\`\n\n`;
  });
  
  return markdown;
}