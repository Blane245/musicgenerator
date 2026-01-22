import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Manual SVG content for React Icons (these are the actual SVG paths from react-icons)
const iconSVGs = {
  // Circle Icons (Ci)
  'play': '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.68L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"></path></svg>',
  
  'pause': '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8 19c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2v10c0 1.1.9 2 2 2zm6-12v10c0 1.1.9 2 2 2s2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2z"></path></svg>',
  
  'stop': '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M16 8v8H8V8h8m2-2H6c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"></path></svg>',

  // Ant Design Icons (Ai)
  'delete': '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M864 256H736v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM416 176h192v80H416v-80zm504 72H104c-4.4 0-8 3.6-8 8v16c0 4.4 3.6 8 8 8h816c4.4 0 8-3.6 8-8v-16c0-4.4-3.6-8-8-8z"></path></svg>',
  
  'edit': '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M257.7 752c2 0 4-.2 6-.5L431.9 722c2-.4 3.9-1.3 5.3-2.8l423.9-423.9a9.96 9.96 0 0 0 0-14.1L694.9 114.9c-1.9-1.9-4.4-2.9-7.1-2.9s-5.2 1-7.1 2.9L256.8 538.8c-1.5 1.5-2.4 3.3-2.8 5.3l-29.5 168.2a33.5 33.5 0 0 0 9.4 29.8c6.6 6.4 14.9 9.9 23.8 9.9z"></path></svg>',

  // CSS.gg Icons (Cg)  
  'rename': '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M2 12.88V11.12C2 10.5 2.45 10 3 10H21C21.55 10 22 10.45 22 11.12V12.88C22 13.5 21.55 14 21 14H3C2.45 14 2 13.55 2 12.88Z"></path></svg>',

  // Ionicons (Io)
  'person': '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M258.9 48C141.92 46.42 46.42 141.92 48 258.9c1.56 112.19 92.91 203.54 205.1 205.1 117.98 1.58 212.58-93.02 211-211-1.56-112.19-92.91-203.54-205.1-205.1zM206.76 310.63c-1.69-5.75-5.64-10.73-11.07-13.97-3.56-2.13-7.61-3.4-11.84-3.71-4.02-.3-8.07.13-11.85 1.25-9.59 2.84-16.96 10.2-19.8 19.8-.73 2.48-1.07 5.06-.99 7.63.21 6.7 3.08 13.17 8.06 18.15s11.45 7.85 18.15 8.06c2.57.08 5.15-.26 7.63-.99 9.6-2.84 16.96-10.2 19.8-19.8 1.12-3.78 1.55-7.83 1.25-11.85-.31-4.23-1.58-8.28-3.71-11.84-3.24-5.43-8.22-9.38-13.97-11.07z"></path></svg>',
  
  'person-outline': '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M344 144c-3.92 52.87-44 96-88 96s-84.15-43.12-88-96c-4-55 35-96 88-96s92 42 88 96z" stroke-linecap="round" stroke-linejoin="round"></path><path d="M256 304c-87 0-175.3 48-191.64 138.6C62.39 453.52 68.57 464 80 464h352c11.44 0 17.62-10.48 15.65-21.4C431.3 352 343 304 256 304z" stroke-linecap="round" stroke-linejoin="round"></path></svg>',

  // Font Awesome Icons (Fa)
  'tools': '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M501.1 395.7L384 278.6c-23.1-23.1-57.6-27.6-85.4-13.9L192 158.1V96L64 0 0 64l96 128h62.1l106.6 106.6c-13.6 27.8-9.2 62.3 13.9 85.4l117.1 117.1c14.6 14.6 38.2 14.6 52.7 0l52.7-52.7c14.5-14.6 14.5-38.2 0-52.7zM331.7 225c28.3 0 54.9 11 74.9 31l19.4 19.4c15.8-6.9 30.8-16.5 43.8-29.5 37.1-37.1 37.1-97.3 0-134.4-37.1-37.1-97.3-37.1-134.4 0-13 13-22.6 28-29.5 43.8l19.4 19.4c20 20.1 45.7 31.1 74.9 31.1l6.9-6.9z"></path></svg>',

  // Remix Icons (Ri)
  'ai-generate': '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M14 2c0 1.1.9 2 2 2h4v4c0 1.1.9 2 2 2s2-.9 2-2V4a2 2 0 0 0-2-2h-4c-1.1 0-2 .9-2 2zM2 10c1.1 0 2-.9 2-2V4h4c1.1 0 2-.9 2-2s-.9-2-2-2H4a2 2 0 0 0-2 2v4c0 1.1.9 2 2 2zm20 4c-1.1 0-2 .9-2 2v4h-4c-1.1 0-2 .9-2 2s.9 2 2 2h4a2 2 0 0 0 2-2v-4c0-1.1-.9-2-2-2zM10 14c-1.1 0-2 .9-2 2v4a2 2 0 0 0 2 2h4c1.1 0 2-.9 2-2s-.9-2-2-2h-4v-4c0-1.1-.9-2-2-2z"></path></svg>',

  // GitHub Octicons (Go)
  'arrow-left': '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M7.28 2.97a.75.75 0 0 1 0 1.06L3.81 7.5h8.44a.75.75 0 0 1 0 1.5H3.81l3.47 3.47a.75.75 0 1 1-1.06 1.06L1.97 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0z"></path></svg>',
  
  'arrow-right': '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M8.72 13.03a.75.75 0 0 1 0-1.06L12.19 8.5H3.75a.75.75 0 0 1 0-1.5h8.44l-3.47-3.47a.75.75 0 0 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0z"></path></svg>',
  
  'arrow-up': '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M13.03 8.72a.75.75 0 0 1-1.06 0L8.5 5.25v8.44a.75.75 0 0 1-1.5 0V5.25L3.53 8.72a.75.75 0 0 1-1.06-1.06l4.25-4.25a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06z"></path></svg>',

  // Phosphor Icons (Pi)
  'envelope': '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><path d="M228,56H28A12,12,0,0,0,16,68V192a12,12,0,0,0,12,12H228a12,12,0,0,0,12-12V68A12,12,0,0,0,228,56ZM24,68a4,4,0,0,1,4-4H228a4,4,0,0,1,4,4v6.78l-76,76a4,4,0,0,1-5.66,0l-76-76ZM228,196H28a4,4,0,0,1-4-4V84.64l70.34,70.34a12,12,0,0,0,17,0L232,84.64V192A4,4,0,0,1,228,196Z"></path></svg>'
};

async function createSVGFiles() {
  // Create directory if it doesn't exist
  const iconsDir = join(process.cwd(), 'docs', 'images', 'icons');
  if (!existsSync(join(process.cwd(), 'docs'))) {
    mkdirSync(join(process.cwd(), 'docs'));
  }
  if (!existsSync(join(process.cwd(), 'docs', 'images'))) {
    mkdirSync(join(process.cwd(), 'docs', 'images'));
  }
  if (!existsSync(iconsDir)) {
    mkdirSync(iconsDir);
  }

  // Generate SVG files
  const results = [];
  
  for (const [iconName, svgContent] of Object.entries(iconSVGs)) {
    try {
      // Clean up SVG and add proper attributes
      const cleanSVG = svgContent
        .replace(/stroke="currentColor"/g, 'stroke="black"')
        .replace(/fill="currentColor"/g, 'fill="white"')
        .replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '')
        .replace(/<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      
      const filePath = join(iconsDir, `${iconName}.svg`);
      writeFileSync(filePath, cleanSVG, 'utf8');
      
      results.push({
        name: iconName,
        path: filePath,
        success: true
      });
      
      console.log(`✓ Created ${iconName}.svg`);
    } catch (error) {
      console.error(`✗ Failed to create ${iconName}.svg:`, error);
      results.push({
        name: iconName,
        success: false,
        error: error.message
      });
    }
  }

  // Create a summary file
  const summaryContent = `# SVG Export Summary

Generated on: ${new Date().toISOString()}

## Successfully Created Files:
${results.filter(r => r.success).map(r => `- ${r.name}.svg`).join('\n')}

## Failed Files:
${results.filter(r => !r.success).map(r => `- ${r.name}: ${r.error}`).join('\n')}

Total: ${results.filter(r => r.success).length}/${results.length} files created successfully.
`;

  writeFileSync(join(iconsDir, 'export-summary.md'), summaryContent, 'utf8');
  
  console.log('\n📁 SVG files created in:', iconsDir);
  console.log(`✅ Successfully created ${results.filter(r => r.success).length}/${results.length} SVG files`);
  
  return results;
}

// Run the function
createSVGFiles().catch(console.error);