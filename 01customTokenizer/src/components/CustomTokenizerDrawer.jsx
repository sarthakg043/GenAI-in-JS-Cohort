import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export function CustomTokenizerDrawer({ onTokenizerSaved }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tokenizers, setTokenizers] = useState([]);
  const [newTokenizerName, setNewTokenizerName] = useState('');
  const [newTokens, setNewTokens] = useState('');
  const [editingId, setEditingId] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTokenizers();
  }, []);

  const loadTokenizers = () => {
    const saved = localStorage.getItem('customTokenizers');
    if (saved) {
      try {
        setTokenizers(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading tokenizers:', error);
        setTokenizers([]);
      }
    }
  };

  const saveTokenizers = (updatedTokenizers) => {
    localStorage.setItem('customTokenizers', JSON.stringify(updatedTokenizers));
    setTokenizers(updatedTokenizers);
    onTokenizerSaved();
  };

  const handleSaveTokenizer = () => {
    if (!newTokenizerName.trim() || !newTokens.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide both name and tokens',
        variant: 'destructive',
      });
      return;
    }

    const tokens = newTokens
      .split('\n')
      .map(token => token.trim())
      .filter(token => token.length > 0);

    if (tokens.length === 0) {
      toast({
        title: 'Error',
        description: 'Please provide at least one token',
        variant: 'destructive',
      });
      return;
    }

    const newTokenizer = {
      id: editingId || Date.now().toString(),
      name: newTokenizerName.trim(),
      tokens,
      createdAt: new Date().toISOString(),
    };

    let updatedTokenizers;
    if (editingId) {
      updatedTokenizers = tokenizers.map(t => t.id === editingId ? newTokenizer : t);
    } else {
      updatedTokenizers = [...tokenizers, newTokenizer];
    }

    saveTokenizers(updatedTokenizers);
    resetForm();

    toast({
      title: 'Success',
      description: `Tokenizer "${newTokenizer.name}" ${editingId ? 'updated' : 'saved'} successfully`,
    });
  };

  const handleDeleteTokenizer = (id) => {
    const updatedTokenizers = tokenizers.filter(t => t.id !== id);
    saveTokenizers(updatedTokenizers);

    toast({
      title: 'Deleted',
      description: 'Tokenizer deleted successfully',
    });
  };

  const handleEditTokenizer = (tokenizer) => {
    setNewTokenizerName(tokenizer.name);
    setNewTokens(tokenizer.tokens.join('\n'));
    setEditingId(tokenizer.id);
  };

  const resetForm = () => {
    setNewTokenizerName('');
    setNewTokens('');
    setEditingId(null);
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Custom Tokenizers
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle>Manage Custom Tokenizers</DrawerTitle>
          <DrawerDescription>
            Create and manage your own tokenizers with predefined token lists
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-6 flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
            {/* Create/Edit Form */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">
                {editingId ? 'Edit Tokenizer' : 'Create New Tokenizer'}
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="tokenizer-name">Name</Label>
                  <Input
                    id="tokenizer-name"
                    value={newTokenizerName}
                    onChange={(e) => setNewTokenizerName(e.target.value)}
                    placeholder="My Custom Tokenizer"
                  />
                </div>

                <div>
                  <Label htmlFor="tokens-input">Tokens (one per line)</Label>
                  <Textarea
                    id="tokens-input"
                    value={newTokens}
                    onChange={(e) => setNewTokens(e.target.value)}
                    placeholder={`hello\nworld\ntokenize\nthis`}
                    className="h-32 font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter each token on a new line
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveTokenizer}>
                    <Save className="w-4 h-4 mr-2" />
                    {editingId ? 'Update' : 'Save'} Tokenizer
                  </Button>
                  {editingId && (
                    <Button variant="outline" onClick={resetForm}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Existing Tokenizers */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">
                Saved Tokenizers ({tokenizers.length})
              </h3>

              <div className="space-y-3 max-h-96 overflow-auto">
                {tokenizers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No custom tokenizers saved yet
                  </p>
                ) : (
                  tokenizers.map((tokenizer) => (
                    <div
                      key={tokenizer.id}
                      className="border rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{tokenizer.name}</h4>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditTokenizer(tokenizer)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTokenizer(tokenizer.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {tokenizer.tokens.length} tokens
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {new Date(tokenizer.createdAt).toLocaleDateString()}
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground max-h-16 overflow-auto">
                        <div className="flex flex-wrap gap-1">
                          {tokenizer.tokens.slice(0, 10).map((token, idx) => (
                            <span key={idx} className="bg-muted px-1 rounded font-mono">
                              {token}
                            </span>
                          ))}
                          {tokenizer.tokens.length > 10 && (
                            <span className="text-muted-foreground">
                              +{tokenizer.tokens.length - 10} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
