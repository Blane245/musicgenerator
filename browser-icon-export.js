// Browser console version - paste this into your browser's developer console
// when your React app is running

// First, import the function (assuming it's available in your build)
// You may need to expose it globally first

// Simple version that doesn't require DOM manipulation
function generateSimpleIconMarkdown() {
  const iconList = {
    'play': 'CiPlay1',
    'pause': 'CiPause1', 
    'stop': 'CiStop1',
    'delete': 'AiFillDelete',
    'edit': 'AiOutlineEdit',
    'rename': 'CgRename',
    'person': 'IoPerson',
    'person-outline': 'IoPersonOutline',
    'tools': 'FaTools',
    'ai-generate': 'RiAiGenerate',
    'arrow-left': 'GoArrowLeft',
    'arrow-right': 'GoArrowRight',
    'arrow-up': 'GoArrowUp',
    'envelope': 'PiEnvelopeThin'
  };

  let markdown = '# CMG Application Icons\n\n';
  
  Object.entries(iconList).forEach(([iconName, componentName]) => {
    markdown += `## ${iconName}\n`;
    markdown += `![${iconName}](./images/icons/${iconName}.svg)\n\n`;
    markdown += `\`\`\`typescript\n`;
    markdown += `import { ${componentName} } from "react-icons/...";\n`;
    markdown += `<${componentName} size={24} />\n`;
    markdown += `\`\`\`\n\n`;
  });
  
  return markdown;
}

// Execute and copy to clipboard
const markdown = generateSimpleIconMarkdown();
navigator.clipboard.writeText(markdown).then(() => {
  console.log('Icon markdown copied to clipboard!');
  console.log(markdown);
});