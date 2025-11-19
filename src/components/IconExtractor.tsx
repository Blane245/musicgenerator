import React, { useRef, useState } from 'react';
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

interface IconExtractorProps {
  onIconsExtracted?: (svgs: { [key: string]: string }) => void;
}

export const IconExtractor: React.FC<IconExtractorProps> = ({ onIconsExtracted }) => {
  const [extractedSVGs, setExtractedSVGs] = useState<{ [key: string]: string }>({});
  const [isExtracting, setIsExtracting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const extractSVGs = async () => {
    if (!containerRef.current) return;

    setIsExtracting(true);
    const svgs: { [key: string]: string } = {};

    try {
      // Extract SVGs from rendered icons
      const iconElements = containerRef.current.querySelectorAll('[data-icon-name]');
      
      iconElements.forEach((element) => {
        const iconName = element.getAttribute('data-icon-name');
        const svgElement = element.querySelector('svg');
        
        if (iconName && svgElement) {
          // Clean up the SVG
          const clonedSVG = svgElement.cloneNode(true) as SVGElement;
          
          // Ensure proper attributes
          if (!clonedSVG.getAttribute('xmlns')) {
            clonedSVG.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
          }
          if (!clonedSVG.getAttribute('viewBox')) {
            clonedSVG.setAttribute('viewBox', '0 0 24 24');
          }
          
          // Remove any React-specific attributes
          clonedSVG.removeAttribute('data-icon');
          clonedSVG.removeAttribute('data-icon-name');
          
          svgs[iconName] = clonedSVG.outerHTML;
        }
      });

      setExtractedSVGs(svgs);
      onIconsExtracted?.(svgs);
      
      console.log('Extracted SVGs:', svgs);
    } catch (error) {
      console.error('Error extracting SVGs:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  const downloadSVG = (iconName: string, svgContent: string) => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${iconName}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllSVGs = () => {
    Object.entries(extractedSVGs).forEach(([name, svg]) => {
      setTimeout(() => downloadSVG(name, svg), 100); // Small delay between downloads
    });
  };

  const copySVGsAsZip = async () => {
    // Create a simple text file with all SVGs
    let content = '// SVG Files for CMG Icons\n\n';
    Object.entries(extractedSVGs).forEach(([name, svg]) => {
      content += `// ${name}.svg\n${svg}\n\n`;
    });
    
    try {
      await navigator.clipboard.writeText(content);
      alert('All SVG content copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>React Icon SVG Extractor</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={extractSVGs} disabled={isExtracting}>
          {isExtracting ? 'Extracting...' : 'Extract SVGs'}
        </button>
        {Object.keys(extractedSVGs).length > 0 && (
          <>
            <button onClick={downloadAllSVGs} style={{ marginLeft: '10px' }}>
              Download All SVGs
            </button>
            <button onClick={copySVGsAsZip} style={{ marginLeft: '10px' }}>
              Copy All to Clipboard
            </button>
          </>
        )}
      </div>

      {/* Hidden container for rendering icons */}
      <div ref={containerRef} style={{ display: 'none' }}>
        {Object.entries(icons).map(([name, IconComponent]) => (
          <div key={name} data-icon-name={name}>
            <IconComponent size={24} />
          </div>
        ))}
      </div>

      {/* Visible icon grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
        {Object.entries(icons).map(([name, IconComponent]) => (
          <div key={name} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <IconComponent size={24} style={{ marginRight: '10px' }} />
              <strong>{name}</strong>
            </div>
            {extractedSVGs[name] && (
              <div>
                <button 
                  onClick={() => downloadSVG(name, extractedSVGs[name])}
                  style={{ fontSize: '12px', padding: '2px 6px' }}
                >
                  Download SVG
                </button>
                <div style={{ fontSize: '10px', marginTop: '5px', maxHeight: '100px', overflow: 'auto' }}>
                  {extractedSVGs[name].substring(0, 100)}...
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};