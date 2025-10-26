import { useState } from 'react';

interface EmbedGeneratorProps {
  dslCode: string;
}

export function EmbedGenerator({ dslCode }: EmbedGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState<'url' | 'embed' | 'iframe' | null>(null);
  const [embedView, setEmbedView] = useState<'graph' | 'canvas'>('graph');

  const generateUrl = () => {
    const encoded = btoa(dslCode);
    const baseUrl = window.location.origin;
    return `${baseUrl}/?dsl=${encoded}`;
  };

  const generateEmbedUrl = () => {
    const encoded = btoa(dslCode);
    const baseUrl = window.location.origin;
    return `${baseUrl}/embed?dsl=${encoded}&view=${embedView}`;
  };

  const generateIframeCode = () => {
    const url = generateEmbedUrl();
    return `<iframe src="${url}" width="800" height="600" frameborder="0" allowfullscreen></iframe>`;
  };

  const copyToClipboard = (text: string, type: 'url' | 'embed' | 'iframe') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '8px 16px',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
        title="Share this model"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
        Share
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '70px',
        right: '20px',
        width: '500px',
        maxWidth: 'calc(100vw - 40px)',
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        color: 'white',
      }}
    >
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
          Share This Model
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '20px',
            padding: '0',
            width: '24px',
            height: '24px',
          }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Shareable URL
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={generateUrl()}
              readOnly
              style={{
                flex: 1,
                padding: '8px 12px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '4px',
                color: 'white',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
            />
            <button
              onClick={() => copyToClipboard(generateUrl(), 'url')}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
              }}
            >
              {copied === 'url' ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Embed View
          </label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <button
              onClick={() => setEmbedView('graph')}
              style={{
                padding: '6px 12px',
                background: embedView === 'graph' ? '#3b82f6' : '#0f172a',
                color: 'white',
                border: '1px solid #334155',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Graph
            </button>
            <button
              onClick={() => setEmbedView('canvas')}
              style={{
                padding: '6px 12px',
                background: embedView === 'canvas' ? '#3b82f6' : '#0f172a',
                color: 'white',
                border: '1px solid #334155',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Canvas
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Embed URL
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={generateEmbedUrl()}
              readOnly
              style={{
                flex: 1,
                padding: '8px 12px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '4px',
                color: 'white',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
            />
            <button
              onClick={() => copyToClipboard(generateEmbedUrl(), 'embed')}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
              }}
            >
              {copied === 'embed' ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Iframe Code
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              value={generateIframeCode()}
              readOnly
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '4px',
                color: 'white',
                fontSize: '12px',
                fontFamily: 'monospace',
                resize: 'vertical',
              }}
            />
            <button
              onClick={() => copyToClipboard(generateIframeCode(), 'iframe')}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                padding: '4px 12px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '500',
              }}
            >
              {copied === 'iframe' ? '✓' : 'Copy'}
            </button>
          </div>
        </div>

        <div
          style={{
            padding: '12px',
            background: '#0f172a',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#94a3b8',
          }}
        >
          <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>
            💡 Embed Options:
          </p>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Choose between Graph or Canvas view for embed</li>
            <li>Users can switch views or open the full editor</li>
            <li>Simulation controls are always available</li>
            <li>Compact mode activates for small iframes (&lt;600px width)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
