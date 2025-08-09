import { normalizeSearchText, fuzzyMatchWord, FUZZY_SEARCH_CONFIG } from "../utils/text_utils.js";

const cachedRegexes: Record<string, RegExp> = {};

function getRegex(str: string) {
    if (!(str in cachedRegexes)) {
        cachedRegexes[str] = new RegExp(str);
    }

    return cachedRegexes[str];
}

type Comparator<T> = (comparedValue: T) => (val: string) => boolean;

const stringComparators: Record<string, Comparator<string>> = {
    "=": (comparedValue) => (val) => val === comparedValue,
    "!=": (comparedValue) => (val) => val !== comparedValue,
    ">": (comparedValue) => (val) => val > comparedValue,
    ">=": (comparedValue) => (val) => val >= comparedValue,
    "<": (comparedValue) => (val) => val < comparedValue,
    "<=": (comparedValue) => (val) => val <= comparedValue,
    "*=": (comparedValue) => (val) => !!val && val.endsWith(comparedValue),
    "=*": (comparedValue) => (val) => !!val && val.startsWith(comparedValue),
    "*=*": (comparedValue) => (val) => !!val && val.includes(comparedValue),
    "%=": (comparedValue) => (val) => !!val && !!getRegex(comparedValue).test(val),
    "~=": (comparedValue) => (val) => {
        if (!val || !comparedValue) return false;
        
        // Validate minimum length for fuzzy search to prevent false positives
        if (comparedValue.length < FUZZY_SEARCH_CONFIG.MIN_FUZZY_TOKEN_LENGTH) {
            return val.includes(comparedValue);
        }
        
        const normalizedVal = normalizeSearchText(val);
        const normalizedCompared = normalizeSearchText(comparedValue);
        
        // First try exact substring match
        if (normalizedVal.includes(normalizedCompared)) {
            return true;
        }
        
        // Then try fuzzy word matching
        const words = normalizedVal.split(/\s+/);
        return words.some(word => fuzzyMatchWord(normalizedCompared, word));
    },
    "~*": (comparedValue) => (val) => {
        if (!val || !comparedValue) return false;
        
        // Validate minimum length for fuzzy search
        if (comparedValue.length < FUZZY_SEARCH_CONFIG.MIN_FUZZY_TOKEN_LENGTH) {
            return val.includes(comparedValue);
        }
        
        const normalizedVal = normalizeSearchText(val);
        const normalizedCompared = normalizeSearchText(comparedValue);
        
        // For ~* operator, use fuzzy matching across the entire content
        return fuzzyMatchWord(normalizedCompared, normalizedVal);
    }
};

const numericComparators: Record<string, Comparator<number>> = {
    ">": (comparedValue) => (val) => parseFloat(val) > comparedValue,
    ">=": (comparedValue) => (val) => parseFloat(val) >= comparedValue,
    "<": (comparedValue) => (val) => parseFloat(val) < comparedValue,
    "<=": (comparedValue) => (val) => parseFloat(val) <= comparedValue
};

function buildComparator(operator: string, comparedValue: string) {
    comparedValue = comparedValue.toLowerCase();

    if (operator in numericComparators && !isNaN(+comparedValue)) {
        return numericComparators[operator](parseFloat(comparedValue));
    }

    if (operator in stringComparators) {
        return stringComparators[operator](comparedValue);
    }
}

export default buildComparator;
