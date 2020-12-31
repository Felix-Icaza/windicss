import fs from 'fs';
import { HTMLParser } from '../src/utils/html';
import { compile, preflight } from '../src/processor';
import { StyleSheet } from '../src/utils/style';

// Example from [Tailwind Playground](https://play.tailwindcss.com/)
const html = `<!--
Welcome to Tailwind Play, the official Tailwind CSS playground!

Everything here works just like it does when you're running Tailwind locally
with a real build pipeline. You can customize your config file, use features
like \`@apply\`, or even add third-party plugins.

Feel free to play with this example if you're just learning, or trash it and
start from scratch if you know enough to be dangerous. Have fun!
-->
<div class="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
<div class="relative py-3 sm:max-w-xl sm:mx-auto">
  <div class="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
  <div class="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
    <div class="max-w-md mx-auto">
      <div>
        <img src="/img/logo.svg" class="h-7 sm:h-8" />
      </div>
      <div class="divide-y divide-gray-200">
        <div class="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
          <p>An advanced online playground for Tailwind CSS, including support for things like:</p>
          <ul class="list-disc space-y-2">
            <li class="flex items-start">
              <span class="h-6 flex items-center sm:h-7">
                <svg class="flex-shrink-0 h-5 w-5 text-cyan-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </span>
              <p class="ml-2">
                Customizing your
                <code class="text-sm font-bold text-gray-900">tailwind.config.js</code> file
              </p>
            </li>
            <li class="flex items-start">
              <span class="h-6 flex items-center sm:h-7">
                <svg class="flex-shrink-0 h-5 w-5 text-cyan-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </span>
              <p class="ml-2">
                Extracting classes with
                <code class="text-sm font-bold text-gray-900">@apply</code>
              </p>
            </li>
            <li class="flex items-start">
              <span class="h-6 flex items-center sm:h-7">
                <svg class="flex-shrink-0 h-5 w-5 text-cyan-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </span>
              <p class="ml-2">Code completion with instant preview</p>
            </li>
          </ul>
          <p>Perfect for learning how the framework works, prototyping a new idea, or creating a demo to share online.</p>
        </div>
        <div class="pt-6 text-base leading-6 font-bold sm:text-lg sm:leading-7">
          <p>Want to dig deeper into Tailwind?</p>
          <p>
            <a href="https://tailwindcss.com/docs" class="text-cyan-600 hover:text-cyan-700"> Read the docs &rarr; </a>
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
</div>
`;

const parser = new HTMLParser(html); // Simple html parser, only has two methods.
const preflightSheet = preflight(parser.parseTags()); // Parse all html tags, then generate preflight

let outputHTML: string[] = [];
let outputCSS: StyleSheet[] = [];
let ignoredClass: string[] = [];
let indexStart = 0;

// Match tailwind ClassName then replace with new ClassName
parser.parseClasses().forEach(p=>{
  outputHTML.push(html.substring(indexStart, p.start));
  const result = compile(p.result, 'windi-', true); // Set third argument to false to hide comments;
  outputCSS.push(result.styleSheet);
  ignoredClass = [...ignoredClass, ...result.ignored];
  outputHTML.push([result.className, ...result.ignored].join(' '));
  indexStart = p.end;
});
outputHTML.push(html.substring(indexStart));

// Classes that not been used
console.log('ignored classes:', ignoredClass);

fs.writeFileSync('compile_test.html', outputHTML.join(''));
fs.writeFileSync('compile_test.css', 
  outputCSS
  .reduce((previousValue: StyleSheet, currentValue: StyleSheet) => previousValue.extend(currentValue)) // Combine all stylesheet
  .extend(preflightSheet, false) // Insert preflight before utilities, set second argument to true to insert after
  .combine() // Remove duplicated classes
  .build(false) // Build css, set true to minify build
)