const crypto = require('crypto');

function generateSHA256(str){
    try {
        const hash = crypto.createHash('sha256');
        hash.update(str, 'utf8');
        return hash.digest('hex');
    }catch (error) {
        console.error('Hash generation error:', error.message);
        throw error;
    }
}

function isPalindrome(str){
    const word = str.toLowerCase().replace(/\s/g, '');

    const reversedWord= word.split('').reverse().join('');

    return reversedWord === word;
}

function countCharacterFrequency(str){
    const frequency = {};

    for(const char of str){
        if(frequency[char]){
            frequency[char]++;
        }else{
            frequency[char] =1;
        }
    }
    return frequency;
}


function analyseString(str){
    return {
        length: str.length,
        is_palindrome: isPalindrome(str),
        unique_characters: new Set(str).size,
        word_count: str.trim().split(/\s+/).length,
        sha256_hash:generateSHA256(str),
        character_frequency: countCharacterFrequency(str)
    };
}


module.exports = {
    analyseString,
    generateSHA256,
    isPalindrome,
    countCharacterFrequency
}