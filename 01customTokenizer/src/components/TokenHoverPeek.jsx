import React, { useState, useEffect, useCallback, useRef } from 'react';
import "../tokenColors.css";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CustomTokenizerDrawer } from './CustomTokenizerDrawer';
import { ModelSelector } from './ModelSelector';
import "./tokenHoverPeek.css"
import { useTokenize } from '@/hooks/useTokenize';

export function TokenHoverPeek() {
  // Large color palette (should match tokenColors.css count)
  const TOKEN_COLOR_COUNT = 25;
  function getTokenColorVar(idx) {
    return `var(--token-color-${idx % TOKEN_COLOR_COUNT})`;
  }
  const [inputText, setInputText] = useState('Enter your text here to see how it gets tokenized. Try pasting some code, a paragraph, or any text you want to analyze!');
  const [tokens, setTokens] = useState([]);
  const [hoveredTokenId, setHoveredTokenId] = useState(null);
  const [showTokenIds, setShowTokenIds] = useState(false);
  const [currentModel, setCurrentModel] = useState({
    id: 'cl100k_base',
    name: 'GPT-4 / GPT-3.5-turbo',
    type: 'built-in',
    encoding: 'cl100k_base'
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const inputRef = useRef(null);
  const outputRef = useRef(null);

  const tokenizeText = useTokenize();

  useEffect(() => {
    tokenizeText(inputText, currentModel, setTokens);
  }, [inputText, currentModel, tokenizeText]);

  const handleModelChange = (model) => {
    setCurrentModel(model);
  };

  const handleTokenizerSaved = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const updateTokenPositions = useCallback(() => {
    if (!outputRef.current) return;
    
    const positions = new Map();
    const tokenElements = outputRef.current.querySelectorAll('[data-token-id]');
    
    tokenElements.forEach((element) => {
      const tokenId = parseInt(element.getAttribute('data-token-id') || '0');
      positions.set(tokenId, element.getBoundingClientRect());
    });
  }, []);

  useEffect(() => {
    updateTokenPositions();
    const handleResize = () => updateTokenPositions();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateTokenPositions, tokens]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleTokenHover = (tokenId) => {
    setHoveredTokenId(tokenId);
    
    if (inputRef.current && tokenId !== null) {
      const token = tokens.find(t => t.id === tokenId);
      if (token) {
        // Highlight corresponding text in input
        inputRef.current.focus();
        inputRef.current.style.setProperty(
          '--token-highlight-color',
          getTokenColorVar(token.id)
        );
        inputRef.current.setSelectionRange(token.start, token.end);
      }
    }
  };

  const renderTokenizedOutput = () => {
    return tokens.map((token) => (
      <span
        key={token.id}
        data-token-id={token.id}
        style={{
          backgroundColor: getTokenColorVar(token.id),
          borderColor: hoveredTokenId === token.id ? getTokenColorVar(token.id) : 'transparent',
          color: '#222',
          boxShadow: hoveredTokenId === token.id ? `0 0 0 2px ${getTokenColorVar(token.id)}` : undefined,
          transition: 'box-shadow 0.2s',
        }}
        className={`inline-block px-1 py-0.5 m-0.5 rounded-sm border cursor-pointer transition-all duration-200 font-mono text-sm`}
        onMouseEnter={() => handleTokenHover(token.id)}
        onMouseLeave={() => handleTokenHover(null)}
        title={`Token ${token.id}: ID ${token.tokenId} - "${token.text}" (${token.end - token.start} chars)`}
      >
        {showTokenIds ? token.tokenId : token.text.replace(/\n/g, '↵').replace(/\t/g, '→')}
      </span>
    ));
  };

  const renderTokenList = () => {
    return (
      <div className="space-y-1">
        {tokens.map((token) => (
          <div
            key={token.id}
            style={{
              backgroundColor: getTokenColorVar(token.id),
              borderColor: hoveredTokenId === token.id ? getTokenColorVar(token.id) : 'transparent',
              boxShadow: hoveredTokenId === token.id ? `0 0 0 2px ${getTokenColorVar(token.id)}` : undefined,
              color: '#222',
              transition: 'box-shadow 0.2s',
            }}
            className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-all duration-200 border`}
            onMouseEnter={() => handleTokenHover(token.id)}
            onMouseLeave={() => handleTokenHover(null)}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Badge variant="outline" className="text-xs px-1.5 py-0.5 font-mono shrink-0">
                {token.id}
              </Badge>
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 font-mono shrink-0">
                {token.tokenId}
              </Badge>
              <span className="font-mono text-sm truncate">
                "{token.text.replace(/\n/g, '\\n').replace(/\t/g, '\\t')}"
              </span>
            </div>
            <span className="text-xs text-muted-foreground ml-2 shrink-0">
              {token.end - token.start}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-[1400px] px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1"></div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Token Hover Peek
              </h1>
            </div>
            <div className="flex-1 flex justify-end">
              <ThemeToggle />
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Visualize how your text gets tokenized. Hover over tokens to see their position in the original text and token details.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 p-4 bg-card rounded-lg border">
          <ModelSelector
            selectedModel={currentModel.id}
            onModelChange={handleModelChange}
            refreshTrigger={refreshTrigger}
          />
          <CustomTokenizerDrawer onTokenizerSaved={handleTokenizerSaved} />
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-4 mb-8">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {inputText.length} characters
          </Badge>
          <Badge variant="default" className="text-sm px-3 py-1">
            {tokens.length} tokens
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1">
            {tokens.length > 0 ? (inputText.length / tokens.length).toFixed(2) : '0'} chars/token
          </Badge>
        </div>

        {/* Main Content - 3 Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Original Text</h2>
              <p className="text-sm text-muted-foreground">
                Enter or paste your text below. Hover over tokens to see highlighting.
              </p>
            </div>
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={handleInputChange}
              placeholder="Enter your text here..."
              className="w-full h-96 p-4 bg-editor-background border border-border rounded-lg resize-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              spellCheck={false}
            />
          </Card>

          {/* Tokenized Output Panel */}
          <Card className="p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold">Tokenized Output</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {showTokenIds ? 'Token IDs' : 'Tokens'}
                  </span>
                  <Switch
                    checked={showTokenIds}
                    onCheckedChange={setShowTokenIds}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {showTokenIds 
                  ? 'Each block shows the token ID number. Toggle to see the actual token text.'
                  : 'Each colored block represents a token. Toggle to see token ID numbers instead.'
                }
              </p>
            </div>
            <div
              ref={outputRef}
              className="h-96 p-4 bg-editor-background border border-border rounded-lg overflow-auto leading-relaxed"
            >
              {tokens.length > 0 ? (
                renderTokenizedOutput()
              ) : (
                <div className="text-muted-foreground text-sm">
                  Enter some text to see the tokenization...
                </div>
              )}
            </div>
          </Card>

          {/* Token List Panel */}
          <Card className="p-6 xl:col-span-1 lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Token Details</h2>
              <p className="text-sm text-muted-foreground">
                List of all tokens with their IDs and character counts. Hover to highlight.
              </p>
            </div>
            <div className="h-96 overflow-auto">
              {tokens.length > 0 ? (
                renderTokenList()
              ) : (
                <div className="text-muted-foreground text-sm">
                  Token list will appear here...
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Using {currentModel.name} tokenization • 
            Hover over tokens to explore the tokenization process
          </p>
        </div>
      </div>
    </div>
  );
}