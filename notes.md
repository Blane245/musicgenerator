# things to to
# Bugs
- when previewing in the generator dialog, changes made to the parameters are lost after the preview. Somehow the dialog has to be reactivated after a preview with these changes but not update the fileContents with the formdata
- preference editor throws error message about soundfont not not in directory
# Enhancements
- add a duplicate track function
- (don't think this is necessary as envelope processing has improved) disable delay of a preset. For presets that have multiple instruments, the shortest delay is removed and the other instrument delays are shortened.
- implement granular synthesis to achieve vibrato, tremelo, glissandi, and other effects
- consider using slow time line scrolling during preview
- pipe dream - add a video producer that takes hints from the composer and does drawings based on the sounds and those hints. See the ChatGPT chat on scribble for some guidance on structural hints from the composer. 
- implement soundfont modulators - this is very complicated and adds alot of controls to each instrument. It would give me better control over attenuation, which is currently problematic. 
- give user control of spectrum parameters and implement sonogram

# 4.2.0 Updates
- provided download for the user manual
- file open/saveas dialogs only display recent directory contents the first time.
- corrected timing unit problem in room reverb
- improved menu layout