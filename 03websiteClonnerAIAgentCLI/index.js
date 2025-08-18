#!/usr/bin/env node

import 'dotenv/config';
import { OpenAI } from 'openai';
import readline from 'readline';
import { main as runWebsiteAgent } from './src/app.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function selectAIProvider() {
  console.log('🤖 Website Cloning AI Assistant');
  console.log('=====================================');
  console.log('');
  console.log('Choose your AI provider:');
  console.log('1. OpenAI (GPT-4o-mini)');
  console.log('2. Google Gemini (gemini-2.5-pro)');
  console.log('');

  const choice = await askQuestion('Select option (1 or 2): ');

  let client = null;
  let modelName = '';

  if (choice === '1') {
    // OpenAI Configuration
    let apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.log('\n🔑 OpenAI API Key not found in environment variables.');
      apiKey = await askQuestion('Please enter your OpenAI API Key: ');
    }

    if (!apiKey) {
      console.error('❌ OpenAI API Key is required!');
      process.exit(1);
    }

    client = new OpenAI({ apiKey });
    modelName = 'gpt-4o-mini';
    console.log('✅ OpenAI configured successfully!');

  } else if (choice === '2') {
    // Google Gemini Configuration using OpenAI-compatible API
    let apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.log('\n🔑 Gemini API Key not found in environment variables.');
      apiKey = await askQuestion('Please enter your Gemini API Key: ');
    }

    if (!apiKey) {
      console.error('❌ Gemini API Key is required!');
      process.exit(1);
    }

    client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    });
    modelName = 'gemini-2.5-pro';
    console.log('✅ Gemini configured successfully!');

  } else {
    console.error('❌ Invalid choice. Please select 1 or 2.');
    rl.close();
    return await selectAIProvider();
  }

  console.log('');
  return { client, modelName };
}

async function main() {
  try {
    const { client, modelName } = await selectAIProvider();
    rl.close();
    
    // Start the website cloning agent with the configured AI client
    await runWebsiteAgent(client, modelName);
  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

main();
