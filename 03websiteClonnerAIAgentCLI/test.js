#!/usr/bin/env node
import 'dotenv/config';
import { OpenAI } from 'openai';

// Test with a simple request to make sure OpenAI works
async function testOpenAI() {
  try {
    const client = new OpenAI({
      apiKey: 'sk-test', // This will fail but let's see the error
    });
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Respond with only JSON: {"step": "START", "content": "Hello world"}'
        },
        {
          role: 'user',
          content: 'Say hello'
        }
      ],
    });
    
    console.log('Response:', response.choices[0].message.content);
  } catch (error) {
    console.log('Error:', error.message);
  }
}

// Test with Gemini OpenAI-compatible API
async function testGemini() {
  try {
    const client = new OpenAI({
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    });
    
    const response = await client.chat.completions.create({
      model: 'gemini-2.5-pro',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Respond with only JSON: {"step": "START", "content": "Hello world"}'
        },
        {
          role: 'user',
          content: 'Say hello'
        }
      ],
    });
    
    console.log('Response:', response.choices[0].message.content);
  } catch (error) {
    console.log('Error:', error.message);
  }
}

console.log('Testing OpenAI:');
await testOpenAI();

console.log('\nTesting Gemini:');
await testGemini();
