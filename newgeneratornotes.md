things to do when inmplementing a new generator and algorithm values
1. Class - add the class filling in the CMG parent requirements
1. Types - Add the generator name to type GeneratorType and enum GENERATORTYPE
1. Track - add the generator to the Track class getXML switch statement
1. 'generator' Dialog - create the dialog for the generator
1. GeneratorDialog
    - handleChange - add generator to switch statment
    - handleTypeChange - add generator to switch statement
    - handleSubmit - add generator to swtich statement
1. GeneratorTypeFormsProps - add generator dialog to HTML
1. 'generator' Nodes - create the source nodes builder
1. BuildSources - add build of buffer nodes for the new generator
1. ReadyGenerate - add the new generator to the filter processors
1. Generate - update the call props for ReadyGenerate and BuildSources
1. ControlsDisplay - all the generator to the check for goodGenerator