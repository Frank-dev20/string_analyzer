const express = require('express');
const router = express.Router();
const Joi = require('joi');
const {analyseString} = require('../utils/string_analyser');

const { 
  addString, 
  getStringByValue, 
  getAllString, 
  deleteStringByValue 
} = require('../data/store');

const createStringSchema = Joi.object({
  value: Joi.string().required().messages({
    'string.base': 'Value must be a string',
    'string.empty': 'Value cannot be empty',
    'any.required': 'Value field is required'
  })
});


/**
 * Parses a natural language query into filter parameters
 * @param {string} query - The natural language query
 * @returns {Object} - Object with parsed_filters and any errors
 */
function parseNaturalLanguageQuery(query) {
  const filters = {};
  const lowerQuery = query.toLowerCase();
  
  // Pattern 1: Palindromic/palindrome
  if (lowerQuery.includes('palindrom')) {
    filters.is_palindrome = true;
  }
  
  // Pattern 2: Single word / one word
  if (lowerQuery.includes('single word') || lowerQuery.includes('one word')) {
    filters.word_count = 1;
  }
  
  // Pattern 3: Two words / double word
  if (lowerQuery.includes('two word') || lowerQuery.includes('double word')) {
    filters.word_count = 2;
  }
  
  // Pattern 4: "longer than X" or "more than X characters"
  const longerThanMatch = lowerQuery.match(/longer than (\d+)|more than (\d+) character/);
  if (longerThanMatch) {
    const length = parseInt(longerThanMatch[1] || longerThanMatch[2]);
    filters.min_length = length + 1; // "longer than 10" means 11+
  }
  
  // Pattern 5: "shorter than X" or "less than X characters"
  const shorterThanMatch = lowerQuery.match(/shorter than (\d+)|less than (\d+) character/);
  if (shorterThanMatch) {
    const length = parseInt(shorterThanMatch[1] || shorterThanMatch[2]);
    filters.max_length = length - 1; // "shorter than 10" means 9 or less
  }
  
  // Pattern 6: "at least X characters"
  const atLeastMatch = lowerQuery.match(/at least (\d+) character/);
  if (atLeastMatch) {
    filters.min_length = parseInt(atLeastMatch[1]);
  }
  
  // Pattern 7: "containing/contains the letter X" or "with the letter X"
  const letterMatch = lowerQuery.match(/contain(?:ing|s)?\s+(?:the\s+)?letter\s+([a-z])|with\s+(?:the\s+)?letter\s+([a-z])/);
  if (letterMatch) {
    filters.contains_character = letterMatch[1] || letterMatch[2];
  }
  
  // Pattern 8: "containing/contains X" (single character at end)
  const containsMatch = lowerQuery.match(/contain(?:ing|s)?\s+([a-z])$/);
  if (containsMatch) {
    filters.contains_character = containsMatch[1];
  }
  
  // Pattern 9: "first vowel" (a), "second vowel" (e), etc.
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  const vowelWords = ['first', 'second', 'third', 'fourth', 'fifth'];
  
  vowelWords.forEach((word, index) => {
    if (lowerQuery.includes(`${word} vowel`)) {
      filters.contains_character = vowels[index];
    }
  });
  
  return filters;
}


router.post('/', (req, res) => {
  // Step 1: Validate request body
  const { error, value: validatedData } = createStringSchema.validate(req.body);
  
  if (error) {
    // Determine if it's a type error (422) or missing field (400)
    const isTypeError = error.details[0].type === 'string.base';
    const statusCode = isTypeError ? 422 : 400;
    
    return res.status(statusCode).json({
      error: error.details[0].message
    });
  }
  
  // Step 2: Analyze the string
  const stringValue = validatedData.value;
  const properties = analyseString(stringValue);
  
  // Step 3: Try to store it
  try {
    const storedString = addString(stringValue, properties);
    
    // Step 4: Return success response (201 Created)
    return res.status(201).json(storedString);
    
  } catch (err) {
    // Handle duplicate (409 Conflict)
    if (err.statusCode === 409) {
      return res.status(409).json({
        error: err.message
      });
    }
        
    
    // Handle unexpected errors (500)
        console.error('Unexpected error:', err);
        return res.status(500).json({
          error: 'Internal server error'
        });
    
    
  }
});




/**
 * GET /strings/filter-by-natural-language
 * Filters strings using natural language query
 */
router.get('/filter-by-natural-language', (req, res) => {
  // Step 1: Get the natural language query
  const query = req.query.query;
  
  // Step 2: Validate query parameter exists
  if (!query) {
    return res.status(400).json({
      error: 'Query parameter is required'
    });
  }
  
  // Step 3: Parse the natural language query into filters
  const parsedFilters = parseNaturalLanguageQuery(query);
  
  // Step 4: Check if any filters were parsed
  if (Object.keys(parsedFilters).length === 0) {
    return res.status(400).json({
      error: 'Unable to parse natural language query',
      original_query: query
    });
  }
  
  // Step 5: Get all strings and apply parsed filters
  let strings = getAllString();
  
  // Apply is_palindrome filter
  if (parsedFilters.is_palindrome !== undefined) {
    strings = strings.filter(s => s.properties.is_palindrome === parsedFilters.is_palindrome);
  }
  
  // Apply min_length filter
  if (parsedFilters.min_length !== undefined) {
    strings = strings.filter(s => s.properties.length >= parsedFilters.min_length);
  }
  
  // Apply max_length filter
  if (parsedFilters.max_length !== undefined) {
    strings = strings.filter(s => s.properties.length <= parsedFilters.max_length);
  }
  
  // Apply word_count filter
  if (parsedFilters.word_count !== undefined) {
    strings = strings.filter(s => s.properties.word_count === parsedFilters.word_count);
  }
  
  // Apply contains_character filter
  if (parsedFilters.contains_character !== undefined) {
    strings = strings.filter(s => s.value.includes(parsedFilters.contains_character));
  }
  
  // Step 6: Return results
  return res.status(200).json({
    data: strings,
    count: strings.length,
    interpreted_query: {
      original: query,
      parsed_filters: parsedFilters
    }
  });
});

/**
 * GET /strings
 * Retrieves all strings with optional filtering
 * Query params: is_palindrome, min_length, max_length, word_count, contains_character
 */
router.get('/', (req, res) => {
  // Step 1: Get all strings from store
  let strings = getAllString();
  
  // Step 2: Parse query parameters
  const filters = {
    is_palindrome: req.query.is_palindrome,
    min_length: req.query.min_length,
    max_length: req.query.max_length,
    word_count: req.query.word_count,
    contains_character: req.query.contains_character
  };
  
  // Step 3: Track which filters were actually applied
  const filtersApplied = {};
  
  // Step 4: Apply filters one by one
  
  // Filter by palindrome
  if (filters.is_palindrome !== undefined) {
    const isPalindromeFilter = filters.is_palindrome === 'true';
    strings = strings.filter(s => s.properties.is_palindrome === isPalindromeFilter);
    filtersApplied.is_palindrome = isPalindromeFilter;
  }
  
  // Filter by minimum length
  if (filters.min_length !== undefined) {
    const minLength = parseInt(filters.min_length);
    
    if (isNaN(minLength)) {
      return res.status(400).json({
        error: 'Invalid min_length parameter: must be a number'
      });
    }
    
    strings = strings.filter(s => s.properties.length >= minLength);
    filtersApplied.min_length = minLength;
  }
  
  // Filter by maximum length
  if (filters.max_length !== undefined) {
    const maxLength = parseInt(filters.max_length);
    
    if (isNaN(maxLength)) {
      return res.status(400).json({
        error: 'Invalid max_length parameter: must be a number'
      });
    }
    
    strings = strings.filter(s => s.properties.length <= maxLength);
    filtersApplied.max_length = maxLength;
  }
  
  // Filter by word count
  if (filters.word_count !== undefined) {
    const wordCount = parseInt(filters.word_count);
    
    if (isNaN(wordCount)) {
      return res.status(400).json({
        error: 'Invalid word_count parameter: must be a number'
      });
    }
    
    strings = strings.filter(s => s.properties.word_count === wordCount);
    filtersApplied.word_count = wordCount;
  }
  
  // Filter by contains character
  if (filters.contains_character !== undefined) {
    const char = filters.contains_character;
    
    if (char.length !== 1) {
      return res.status(400).json({
        error: 'Invalid contains_character parameter: must be a single character'
      });
    }
    
    strings = strings.filter(s => s.value.includes(char));
    filtersApplied.contains_character = char;
  }
  
  // Step 5: Return filtered results
  return res.status(200).json({
    data: strings,
    count: strings.length,
    filters_applied: filtersApplied
  });
});


/**
 * GET /strings/:string_value
 * Retrieves a specific string by its value
 */
router.get('/:string_value', (req, res) => {
  // Step 1: Get the string value from URL parameter
  const stringValue = req.params.string_value;
  
  // Step 2: Look it up in the store
  const stringData = getStringByValue(stringValue);
  
  // Step 3: Check if found
  if (!stringData) {
        return res.status(404).json({
        error: 'String does not exist in the system'
     });
   }
  
  // Step 4: Return the string data (200 OK)
  return res.status(200).json(stringData);
});


/**
 * DELETE /strings/:string_value
 * Deletes a string by its value
 */
router.delete('/:string_value', (req, res) => {
  // Step 1: Get the string value from URL parameter
  const stringValue = req.params.string_value;
  
  // Step 2: Try to delete it
  const deleted = deleteStringByValue(stringValue);
  
  // Step 3: Check if it was found and deleted
  if (!deleted) {
    return res.status(404).json({
      error: 'String does not exist in the system'
    });
  }
  
  // Step 4: Return 204 No Content (successful deletion)
  return res.status(204).send();
});


module.exports = router;