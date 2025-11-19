// Simple script to generate icon markdown without importing TypeScript
import { writeFileSync } from 'fs';

// Icon mapping for export (copied from icon-export.ts)
const icons = {
  // Timeline controls
  'play': 'CiPlay1',
  'pause': 'CiPause1',
  'stop': 'CiStop1',
  
  // Track controls
  'delete': 'AiFillDelete',
  'edit': 'AiOutlineEdit',
  'rename': 'CgRename',
  'person': 'IoPerson',
  'person-outline': 'IoPersonOutline',
  'tools': 'FaTools',
  'ai-generate': 'RiAiGenerate',
  
  // Navigation
  'arrow-left': 'GoArrowLeft',
  'arrow-right': 'GoArrowRight',
  'arrow-up': 'GoArrowUp',
  
  // Processing
  'envelope': 'PiEnvelopeThin'
};

// Function to generate markdown with icons
function generateIconMarkdown() {
  let markdown = '# CMG Application Icons\n\n';
  
  Object.entries(icons).forEach(([iconName, componentName]) => {
    markdown += `## ${iconName}\n`;
    markdown += `![${iconName}](./images/icons/${iconName}.svg)\n\n`;
    markdown += `\`\`\`typescript\n`;
    markdown += `import { ${componentName} } from "react-icons/...";\n`;
    markdown += `<${componentName} size={24} />\n`;
    markdown += `\`\`\`\n\n`;
  });
  
  return markdown;
}

// Generate the markdown
const markdown = generateIconMarkdown();

// Save to file
writeFileSync('./docs/generated-icons.md', markdown);

// Also log to console
console.log('Generated icon markdown:');
console.log(markdown);
console.log('\nMarkdown saved to ./docs/generated-icons.md');