'use strict';

var NodeType = require('../node/node-types');

/**
 * Mark whitespaces and comments
 * @param {Array} tokens
 */
function markSpacesAndComments(tokens) {
  var tokensLength = tokens.length;
  var spaces = [-1, -1];
  var type; // Current token's type

  // For every token in the token list, mark spaces and line breaks
  // as spaces (set both `ws` and `sc` flags). Mark multiline comments
  // with `sc` flag.
  // If there are several spaces or tabs or line breaks or multiline
  // comments in a row, group them: take the last one's index number
  // and save it to the first token in the group as a reference:
  // e.g., `ws_last = 7` for a group of whitespaces or `sc_last = 9`
  // for a group of whitespaces and comments.
  for (var i = 0; i < tokensLength; i++) {
    type = tokens[i].type;

    if (type === NodeType.SPACE) {
      markSpace(tokens, i, spaces);
    } else if (type === NodeType.MULTILINE_COMMENT) {
      markComment(tokens, i, spaces);
    } else {
      markEndOfSpacesAndComments(tokens, i, spaces);
    }
  }

  markEndOfSpacesAndComments(tokens, i, spaces);
}

function markSpace(tokens, i, spaces) {
  var token = tokens[i];
  token.ws = true;
  token.sc = true;

  if (spaces[0] === -1) spaces[0] = i;
  if (spaces[1] === -1) spaces[1] = i;
}

function markComment(tokens, i, spaces) {
  var ws = spaces[0];
  tokens[i].sc = true;

  if (ws !== -1) {
    tokens[ws].ws_last = i - 1;
    spaces[0] = -1;
  }
}

function markEndOfSpacesAndComments(tokens, i, spaces) {
  var ws = spaces[0];
  var sc = spaces[1];
  if (ws !== -1) {
    tokens[ws].ws_last = i - 1;
    spaces[0] = -1;
  }
  if (sc !== -1) {
    tokens[sc].sc_last = i - 1;
    spaces[1] = -1;
  }
}

/**
 * Pair brackets
 * @param {Array} tokens
 */
function markBrackets(tokens) {
  let tokensLength = tokens.length;
  let ps = []; // Parentheses
  let sbs = []; // Square brackets
  let cbs = []; // Curly brackets
  let t; // Current token

  // For every token in the token list, if we meet an opening (left)
  // bracket, push its index number to a corresponding array.
  // If we then meet a closing (right) bracket, look at the corresponding
  // array. If there are any elements (records about previously met
  // left brackets), take a token of the last left bracket (take
  // the last index number from the array and find a token with
  // this index number) and save right bracket's index as a reference:
  for (var i = 0; i < tokensLength; i++) {
    t = tokens[i];
    var type = t.type;

    if (type === NodeType.LEFT_PARENTHESIS) {
      ps.push(i);
    } else if (type === NodeType.RIGHT_PARENTHESIS) {
      if (ps.length) {
        t.left = ps.pop();
        tokens[t.left].right = i;
      }
    } else if (type === NodeType.LEFT_SQUARE_BRACKET) {
      sbs.push(i);
    } else if (type === NodeType.RIGHT_SQUARE_BRACKET) {
      if (sbs.length) {
        t.left = sbs.pop();
        tokens[t.left].right = i;
      }
    } else if (type === NodeType.LEFT_CURLY_BRACKET) {
      cbs.push(i);
    } else if (type === NodeType.RIGHT_CURLY_BRACKET) {
      if (cbs.length) {
        t.left = cbs.pop();
        tokens[t.left].right = i;
      }
    }
  }
}

/**
 * @param {Array} tokens
 */
function markTokens(tokens) {
  // Mark paired brackets:
  markBrackets(tokens);
  // Mark whitespaces and comments:
  markSpacesAndComments(tokens);
}

module.exports = markTokens;
