import Editor from '@monaco-editor/react';
import { useEffect, useRef } from 'react';
import { parseDSL } from '../parser/DSLParser';
import { SystemModel } from '../models/SystemModel';

interface DSLEditorProps {
  code: string;
  onChange: (code: string) => void;
  onModelUpdate: (model: SystemModel) => void;
}

export function DSLEditor({ code, onChange, onModelUpdate }: DSLEditorProps) {
  const editorRef = useRef<any>(null);

  // Parse DSL and update model
  useEffect(() => {
    try {
      const model = parseDSL(code);
      onModelUpdate(model);
    } catch (error) {
      console.error('DSL Parse Error:', error);
    }
  }, [code, onModelUpdate]);

  // Configure Monaco for custom DSL
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Register custom language
    monaco.languages.register({ id: 'system-dynamics' });

    // Define syntax highlighting
    monaco.languages.setMonarchTokensProvider('system-dynamics', {
      keywords: ['stock', 'flow', 'const', 'from', 'to', 'rate', 'initial', 'units', 'source', 'sink', 'terminate', 'when', 'min', 'max', 'graph', 'title', 'variables', 'type', 'yAxisLabel', 'color'],
      builtinConstants: ['PI', 'E', 'TIME', 'dt'],
      mathFunctions: ['sin', 'cos', 'tan', 'sqrt', 'abs', 'floor', 'ceil', 'round', 'min', 'max', 'pow', 'exp', 'log'],

      tokenizer: {
        root: [
          [/\/\/.*/, 'comment'],
          [/[a-zA-Z_]\w*/, {
            cases: {
              '@keywords': 'keyword',
              '@builtinConstants': 'constant',
              '@mathFunctions': 'function',
              '@default': 'identifier'
            }
          }],
          [/\d+(\.\d+)?/, 'number'],
          [/"[^"]*"/, 'string'],
          [/[{}]/, 'delimiter.bracket'],
          [/:/, 'delimiter'],
          [/[+\-*/()]/, 'operator'],
        ]
      }
    });

    // Define theme
    monaco.editor.defineTheme('system-dynamics-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '569cd6' },
        { token: 'constant', foreground: '4fc1ff' },
        { token: 'function', foreground: 'dcdcaa' },
        { token: 'identifier', foreground: '9cdcfe' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'comment', foreground: '6a9955' },
        { token: 'operator', foreground: 'd4d4d4' },
      ],
      colors: {}
    });

    monaco.editor.setTheme('system-dynamics-theme');
  };

  return (
    <Editor
      height="100%"
      defaultLanguage="system-dynamics"
      value={code}
      onChange={(value) => onChange(value || '')}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'on',
        folding: false,
      }}
    />
  );
}
