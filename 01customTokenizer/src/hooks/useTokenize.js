import { useCallback } from 'react'
import { getEncoding } from 'js-tiktoken';

export const useTokenize = () => {

  return useCallback((text, model, setTokens) => {
    if (!text.trim()) {
      setTokens([]);
      return;
    }

    try {
      if (model.type === 'custom' && model.customTokens) {
        // Custom tokenizer logic
        const tokenList = [];
        let currentPosition = 0;
        let tokenIndex = 0;
        
        while (currentPosition < text.length) {
          let matched = false;
          
          // Try to match the longest possible token first
          const sortedTokens = [...model.customTokens].sort((a, b) => b.length - a.length);
          
          for (const token of sortedTokens) {
            if (text.slice(currentPosition, currentPosition + token.length) === token) {
              tokenList.push({
                id: tokenIndex,
                tokenId: model.customTokens.indexOf(token), // Use index as token ID for custom tokens
                text: token,
                start: currentPosition,
                end: currentPosition + token.length
              });
              
              currentPosition += token.length;
              tokenIndex++;
              matched = true;
              break;
            }
          }
          
          // If no token matched, treat single character as token
          if (!matched) {
            const char = text[currentPosition];
            tokenList.push({
              id: tokenIndex,
              tokenId: -1, // Special ID for unmatched characters
              text: char,
              start: currentPosition,
              end: currentPosition + 1
            });
            
            currentPosition++;
            tokenIndex++;
          }
        }
        
        setTokens(tokenList);
      } else {
        // Built-in tiktoken encoding
        const encodingName =
            model.encoding === 'cl100k_base' ||
            model.encoding === 'p50k_base' ||
            model.encoding === 'r50k_base'
            ? model.encoding
            : 'cl100k_base';

        const encoding = getEncoding(encodingName);
        const encoded = encoding.encode(text);
        const tokenList = [];
        
        let currentPosition = 0;
        encoded.forEach((tokenId, index) => {
          const decoded = encoding.decode([tokenId]);
          const start = currentPosition;
          const end = currentPosition + decoded.length;
          
          tokenList.push({
            id: index,
            tokenId: tokenId,
            text: decoded,
            start,
            end
          });
          
          currentPosition = end;
        });
        
        setTokens(tokenList);
      }
    } catch (error) {
      console.error('Tokenization error:', error);
      setTokens([]);
    }
  }, []);

}