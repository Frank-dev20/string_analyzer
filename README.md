# HNG13 BACKEND Stage 1 Task 
## Build a String Analyzer Service
**Overview**
This is a robust string analyser service backend API built with Nodejs/Express. One unique feature of this service is that it can strings by natural language.

### Technology stack
- Express: Building robust and scalable RESTful API services
- Cors: Cross-origin resource sharing
- JOI: JavaScriot schema description language
- Morgan:Node.js logger middleware
- In-built Crypto module

## Getting Started

1. Clone git repo
 `git clone https://github.com/Frank-dev20/string_analyzer.git`

2. Install required packages
 `npm install`

3. Change directory
 `cd string_analyser_api`

4. Start server
 `node server.js`

## Usage
Once server starts you can test the API using ThunderClient, curl, or Postman.

1. Create/Analyze String
 POST /strings
    Content-Type: application/json
    Request Body:
    `{"value": "string to analyze"}`

2. Get Specific String
 GET /strings/
 `{string_value}`

3. Get All Strings with Filtering
 GET /strings?is_palindrome=true&min_length=5&max_length=20&word_count=2&contains_character=a

4. Natural Language Filtering
 GET /strings/filter-by-natural-language?query=all%20single%20word%20palindromic%20strings

5. Delete String
 DELETE /strings/
 `{string_value}`








