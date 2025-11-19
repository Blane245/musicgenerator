# React Icons Reference

This document shows the React Icons used in the CMG application.

## Icons by Category

### Timeline Controls
- `CiPlay1` - Play button
- `CiPause1` - Pause button 
- `CiStop1` - Stop button
- `CiFastForward` - Fast forward
- `CiRewind` - Rewind

### Track Controls
- `AiFillDelete` - Delete track
- `AiOutlineEdit` - Edit track
- `CgRename` - Rename track
- `IoPerson` / `IoPersonOutline` - Person/user icon
- `FaTools` - Tools menu
- `RiAiGenerate` - AI Generate

### File Dialog
- `GoArrowLeft` - Go back/left arrow
- `GoArrowRight` - Go forward/right arrow  
- `GoArrowUp` - Go up/up arrow

### Envelope Processing
- `PiEnvelopeThin` - Envelope icon

## Usage Examples

To use these icons in your React components:

```typescript
import { CiPlay1 } from "react-icons/ci";

function PlayButton() {
  return <CiPlay1 size={24} />;
}
```

## Icon Sources

- **Ci** - Circum Icons
- **Ai** - Ant Design Icons  
- **Cg** - css.gg icons
- **Io** - Ionicons
- **Fa** - Font Awesome
- **Ri** - Remix Icons
- **Go** - Github Octicons
- **Pi** - Phosphor Icons

## Converting Icons for Documentation

To include these icons in markdown documentation, you can:

1. Export them as SVG files from the react-icons library
2. Use online converters to get base64 encoded versions
3. Screenshot the rendered icons and save as PNG/JPG files