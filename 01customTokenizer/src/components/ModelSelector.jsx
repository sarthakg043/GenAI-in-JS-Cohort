import React, { useState, useEffect } from 'react';
import { ChevronDown, Bot, User } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const BUILT_IN_MODELS = [
  { id: 'cl100k_base', name: 'GPT-4 / GPT-3.5-turbo', type: 'built-in', encoding: 'cl100k_base' },
  { id: 'p50k_base', name: 'GPT-3 (Davinci)', type: 'built-in', encoding: 'p50k_base' },
  { id: 'r50k_base', name: 'GPT-3 (Ada/Babbage/Curie)', type: 'built-in', encoding: 'r50k_base' },
];

export function ModelSelector({ selectedModel, onModelChange, refreshTrigger }) {
  const [models, setModels] = useState(BUILT_IN_MODELS);

  useEffect(() => {
    loadCustomTokenizers();
  }, [refreshTrigger]);

  const loadCustomTokenizers = () => {
    const saved = localStorage.getItem('customTokenizers');
    let customModels = [];

    if (saved) {
      try {
        const customTokenizers = JSON.parse(saved);
        customModels = customTokenizers.map(tokenizer => ({
          id: `custom_${tokenizer.id}`,
          name: tokenizer.name,
          type: 'custom',
          customTokens: tokenizer.tokens,
        }));
      } catch (error) {
        console.error('Error loading custom tokenizers:', error);
      }
    }

    setModels([...BUILT_IN_MODELS, ...customModels]);
  };

  const handleModelChange = (modelId) => {
    const model = models.find(m => m.id === modelId);
    if (model) {
      onModelChange(model);
    }
  };

  const currentModel = models.find(m => m.id === selectedModel) || models[0];

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium">Tokenizer:</label>
      <Select value={selectedModel} onValueChange={handleModelChange}>
        <SelectTrigger className="w-64">
          <SelectValue>
            <div className="flex items-center gap-2">
              {currentModel.type === 'built-in' ? (
                <Bot className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
              <span className="truncate">{currentModel.name}</span>
              <Badge
                variant={currentModel.type === 'built-in' ? 'default' : 'secondary'}
                className="text-xs ml-auto"
              >
                {currentModel.type === 'built-in' ? 'Built-in' : 'Custom'}
              </Badge>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {BUILT_IN_MODELS.map(model => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                <span>{model.name}</span>
                <Badge variant="default" className="text-xs ml-auto">
                  Built-in
                </Badge>
              </div>
            </SelectItem>
          ))}

          {models.filter(m => m.type === 'custom').length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-t">
                Custom Tokenizers
              </div>
              {models
                .filter(m => m.type === 'custom')
                .map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="truncate">{model.name}</span>
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {model.customTokens?.length || 0}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
