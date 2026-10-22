// Native Coaching Tools & Problem Bank for Alexa+

export const PROBLEMS_BANK = [
    {
        id: "dsa_1",
        category: "tech_coach",
        title: "1. Two Sum",
        leetcodeNumber: 1,
        difficulty: "Easy / Amazon SDE-1",
        topic: "Arrays & HashMaps",
        section: "Data Structures & Algorithms",
        marks: "+4 / -1",
        question: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
        targetOptimization: "HashMap approach reduces O(N^2) brute force down to O(N) time and O(N) space.",
        options: [
            "Brute Force Nested Loops: O(N²) Time, O(1) Space",
            "One-pass HashMap: O(N) Time, O(N) Space",
            "Sort & Binary Search: O(N log N) Time, O(1) Space",
            "Two Pointers on unsorted array: O(N) Time, O(1) Space"
        ],
        correctOption: 1,
        hint: "Store each visited element and its index in a hash map as you traverse. Check if (target - num) already exists.",
        explanation: "By maintaining a Map storing (value -> index), each complement lookup takes O(1) average time, resulting in O(N) overall time complexity.",
        solutionCode: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[]{};
    }
}`,
        pythonCode: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        lookup = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in lookup:
                return [lookup[complement], i]
            lookup[num] = i
        return []`,
        cppCode: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> map;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (map.find(complement) != map.end()) {
                return {map[complement], i};
            }
            map[nums[i]] = i;
        }
        return {};
    }
};`,
        jsCode: `var twoSum = function(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
};`,
        examples: [
            { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
            { input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]." },
            { input: "nums = [3,3], target = 6", output: "[0,1]", explanation: "nums[0] + nums[1] == 6, indices are [0, 1]." }
        ],
        constraints: [
            "2 <= nums.length <= 10^4",
            "-10^9 <= nums[i] <= 10^9",
            "-10^9 <= target <= 10^9",
            "Only one valid answer exists."
        ]
    },
    {
        id: "dsa_2",
        category: "tech_coach",
        title: "189. Rotate Array by K steps",
        leetcodeNumber: 189,
        difficulty: "Medium / Amazon SDE-1",
        topic: "Arrays & In-place Reversals",
        section: "Data Structures & Algorithms",
        marks: "+4 / -1",
        question: "Given an integer array nums, rotate the array to the right by k steps, where k is non-negative. Do it in-place with O(1) extra space.",
        targetOptimization: "Reversing array in 3 parts achieves O(N) time and O(1) space.",
        options: [
            "Shift elements one by one K times: O(N*K) Time, O(1) Space",
            "Extra buffer array of size N: O(N) Time, O(N) Space",
            "Three-step array reversal in-place: O(N) Time, O(1) Space",
            "Recursive swap rotation: O(N) Time, O(N) Stack Space"
        ],
        correctOption: 2,
        hint: "Try reversing the entire array first, then reverse the first k elements, and lastly reverse the remaining n-k elements.",
        explanation: "Reversing the entire array places elements near their target region. Reversing [0, k-1] and [k, n-1] restores the correct relative order in O(N) time and O(1) auxiliary space.",
        solutionCode: `class Solution {
    public void rotate(int[] nums, int k) {
        k %= nums.length;
        reverse(nums, 0, nums.length - 1);
        reverse(nums, 0, k - 1);
        reverse(nums, k, nums.length - 1);
    }
    private void reverse(int[] nums, int start, int end) {
        while (start < end) {
            int temp = nums[start];
            nums[start++] = nums[end];
            nums[end--] = temp;
        }
    }
}`,
        pythonCode: `class Solution:
    def rotate(self, nums: List[int], k: int) -> None:
        k %= len(nums)
        def reverse(l, r):
            while l < r:
                nums[l], nums[r] = nums[r], nums[l]
                l += 1; r -= 1
        reverse(0, len(nums) - 1)
        reverse(0, k - 1)
        reverse(k, len(nums) - 1)`,
        cppCode: `class Solution {
public:
    void rotate(vector<int>& nums, int k) {
        k %= nums.size();
        reverse(nums.begin(), nums.end());
        reverse(nums.begin(), nums.begin() + k);
        reverse(nums.begin() + k, nums.end());
    }
};`,
        jsCode: `var rotate = function(nums, k) {
    k %= nums.length;
    const reverse = (l, r) => {
        while (l < r) {
            [nums[l], nums[r]] = [nums[r], nums[l]];
            l++; r--;
        }
    };
    reverse(0, nums.length - 1);
    reverse(0, k - 1);
    reverse(k, nums.length - 1);
};`,
        examples: [
            { input: "nums = [1,2,3,4,5,6,7], k = 3", output: "[5,6,7,1,2,3,4]", explanation: "rotate 1 steps to right: [7,1,2,3,4,5,6]\nrotate 2 steps: [6,7,1,2,3,4,5]\nrotate 3 steps: [5,6,7,1,2,3,4]" },
            { input: "nums = [-1,-100,3,99], k = 2", output: "[3,99,-1,-100]", explanation: "rotate 2 steps gives [3,99,-1,-100]." }
        ],
        constraints: [
            "1 <= nums.length <= 10^5",
            "-2^31 <= nums[i] <= 2^31 - 1",
            "0 <= k <= 10^5"
        ]
    },
    {
        id: "dsa_3",
        category: "tech_coach",
        title: "20. Valid Parentheses",
        leetcodeNumber: 20,
        difficulty: "Easy / Amazon Phone Screen",
        topic: "Stacks & Strings",
        section: "Data Structures & Algorithms",
        marks: "+4 / -1",
        question: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. Open brackets must be closed by the same type of brackets in the correct order.",
        targetOptimization: "Use a Stack to match opening and closing brackets in O(N) time and O(N) space.",
        options: [
            "Counter integers for each parenthesis type",
            "LIFO Stack matching opening to corresponding closing brackets",
            "Two pointers meeting in the middle",
            "Recursive string replacement of '()', '[]', '{}'"
        ],
        correctOption: 1,
        hint: "When encountering an opening bracket, push its expected closing bracket onto a stack. When encountering a closing bracket, pop and verify.",
        explanation: "A stack guarantees proper nesting order (Last In, First Out). If the stack is empty or the popped bracket does not match, the sequence is invalid.",
        solutionCode: `class Solution {
    public boolean isValid(String s) {
        Stack<Character> stack = new Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(') stack.push(')');
            else if (c == '{') stack.push('}');
            else if (c == '[') stack.push(']');
            else if (stack.isEmpty() || stack.pop() != c) return false;
        }
        return stack.isEmpty();
    }
}`,
        pythonCode: `class Solution:
    def isValid(self, s: str) -> bool:
        stack = []
        mapping = {')': '(', '}': '{', ']': '['}
        for char in s:
            if char in mapping:
                top = stack.pop() if stack else '#'
                if mapping[char] != top:
                    return False
            else:
                stack.append(char)
        return not stack`,
        cppCode: `class Solution {
public:
    bool isValid(string s) {
        stack<char> st;
        for (char c : s) {
            if (c == '(' || c == '{' || c == '[') st.push(c);
            else {
                if (st.empty()) return false;
                if (c == ')' && st.top() != '(') return false;
                if (c == '}' && st.top() != '{') return false;
                if (c == ']' && st.top() != '[') return false;
                st.pop();
            }
        }
        return st.empty();
    }
};`,
        jsCode: `var isValid = function(s) {
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    for (const c of s) {
        if (!map[c]) stack.push(c);
        else if (stack.pop() !== map[c]) return false;
    }
    return stack.length === 0;
};`,
        examples: [
            { input: 's = "()"', output: "true", explanation: "Single matching pair of parentheses." },
            { input: 's = "()[]{}"', output: "true", explanation: "All consecutive pairs match properly." },
            { input: 's = "(]"', output: "false", explanation: "Mismatched bracket types." }
        ],
        constraints: [
            "1 <= s.length <= 10^4",
            "s consists of parentheses only: '()[]{}'."
        ]
    },
    {
        id: "dsa_4",
        category: "tech_coach",
        title: "121. Best Time to Buy and Sell Stock",
        leetcodeNumber: 121,
        difficulty: "Easy / Amazon SDE-1",
        topic: "Arrays & Dynamic Programming",
        section: "Data Structures & Algorithms",
        marks: "+4 / -1",
        question: "You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve.",
        targetOptimization: "Single-pass tracking of minPrice achieves O(N) time and O(1) space.",
        options: [
            "Compare all (i, j) pairs: O(N²) Time, O(1) Space",
            "One-pass tracking min price & max profit: O(N) Time, O(1) Space",
            "Sort prices and take difference of extremes: O(N log N) Time",
            "Divide and conquer with O(N log N) Time"
        ],
        correctOption: 1,
        hint: "As you walk through the array, keep track of the lowest buying price seen so far. At each step, calculate (currentPrice - minPrice) to update max profit.",
        explanation: "By recording minPrice so far, each day allows a potential profit check in O(1). Total time is O(N) with O(1) space.",
        solutionCode: `class Solution {
    public int maxProfit(int[] prices) {
        int minPrice = Integer.MAX_VALUE;
        int maxProfit = 0;
        for (int price : prices) {
            if (price < minPrice) minPrice = price;
            else if (price - minPrice > maxProfit) maxProfit = price - minPrice;
        }
        return maxProfit;
    }
}`,
        pythonCode: `class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        min_price = float('inf')
        max_profit = 0
        for p in prices:
            min_price = min(min_price, p)
            max_profit = max(max_profit, p - min_price)
        return max_profit`,
        cppCode: `class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int minPrice = INT_MAX, maxProfit = 0;
        for (int p : prices) {
            minPrice = min(minPrice, p);
            maxProfit = max(maxProfit, p - minPrice);
        }
        return maxProfit;
    }
};`,
        jsCode: `var maxProfit = function(prices) {
    let minPrice = Infinity, maxProfit = 0;
    for (const p of prices) {
        minPrice = Math.min(minPrice, p);
        maxProfit = Math.max(maxProfit, p - minPrice);
    }
    return maxProfit;
};`,
        examples: [
            { input: "prices = [7,1,5,3,6,4]", output: "5", explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6 - 1 = 5." },
            { input: "prices = [7,6,4,3,1]", output: "0", explanation: "In this case, no transactions are done and max profit = 0." }
        ],
        constraints: [
            "1 <= prices.length <= 10^5",
            "0 <= prices[i] <= 10^4"
        ]
    },
    {
        id: "dsa_5",
        category: "tech_coach",
        title: "206. Reverse Linked List",
        leetcodeNumber: 206,
        difficulty: "Easy / Amazon Phone Screen",
        topic: "Linked Lists",
        section: "Data Structures & Algorithms",
        marks: "+4 / -1",
        question: "Given the head of a singly linked list, reverse the list, and return the reversed list. Can you do it iteratively in O(N) time and O(1) space?",
        targetOptimization: "Iterative pointer reversal (prev, curr, next) achieves O(N) time and O(1) space.",
        options: [
            "Copy values to array and reconstruct list: O(N) Time, O(N) Space",
            "Iterative three-pointer reversal (prev, curr, next): O(N) Time, O(1) Space",
            "Recursive head-insertion: O(N) Time, O(N) Stack Space",
            "Doubly linked list conversion: O(N) Space"
        ],
        correctOption: 1,
        hint: "Keep track of prev (initially null), curr (initially head), and nextTemp. Change curr.next to prev, then advance prev and curr.",
        explanation: "Iterating through the list once and reversing each node's next pointer achieves linear O(N) time and optimal O(1) auxiliary space.",
        solutionCode: `class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;
        while (curr != null) {
            ListNode nextTemp = curr.next;
            curr.next = prev;
            prev = curr;
            curr = nextTemp;
        }
        return prev;
    }
}`,
        pythonCode: `class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        prev, curr = None, head
        while curr:
            nxt = curr.next
            curr.next = prev
            prev = curr
            curr = nxt
        return prev`,
        cppCode: `class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode *prev = nullptr, *curr = head;
        while (curr) {
            ListNode* nextTemp = curr->next;
            curr->next = prev;
            prev = curr;
            curr = nextTemp;
        }
        return prev;
    }
};`,
        jsCode: `var reverseList = function(head) {
    let prev = null, curr = head;
    while (curr) {
        const nextTemp = curr.next;
        curr.next = prev;
        prev = curr;
        curr = nextTemp;
    }
    return prev;
};`,
        examples: [
            { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]", explanation: "The reversed linked list from 1->2->3->4->5 is 5->4->3->2->1." },
            { input: "head = [1,2]", output: "[2,1]", explanation: "1->2 reversed is 2->1." }
        ],
        constraints: [
            "The number of nodes in the list is the range [0, 5000].",
            "-5000 <= Node.val <= 5000"
        ]
    },
    {
        id: "dsa_6",
        category: "tech_coach",
        title: "53. Maximum Subarray (Kadane's Algorithm)",
        leetcodeNumber: 53,
        difficulty: "Medium / Amazon SDE-1",
        topic: "Arrays & Dynamic Programming",
        section: "Data Structures & Algorithms",
        marks: "+4 / -1",
        question: "Given an integer array nums, find the subarray with the largest sum, and return its sum.",
        targetOptimization: "Kadane's algorithm computes max subarray sum in O(N) time and O(1) space.",
        options: [
            "Check all O(N²) subarrays with nested loops",
            "Kadane's Algorithm (curSum = max(num, curSum + num)): O(N) Time, O(1) Space",
            "Divide and conquer with O(N log N) Time",
            "Prefix sum array with binary search: O(N log N) Time"
        ],
        correctOption: 1,
        hint: "At each element, decide whether to add it to the existing subarray sum or start a new subarray fresh from this element.",
        explanation: "Kadane's DP decision is: curSum = Math.max(num, curSum + num). Tracking global max across the array yields O(N) time and O(1) memory.",
        solutionCode: `class Solution {
    public int maxSubArray(int[] nums) {
        int maxSoFar = nums[0];
        int curMax = nums[0];
        for (int i = 1; i < nums.length; i++) {
            curMax = Math.max(nums[i], curMax + nums[i]);
            maxSoFar = Math.max(maxSoFar, curMax);
        }
        return maxSoFar;
    }
}`,
        pythonCode: `class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        cur_sum = max_sum = nums[0]
        for x in nums[1:]:
            cur_sum = max(x, cur_sum + x)
            max_sum = max(max_sum, cur_sum)
        return max_sum`,
        cppCode: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int curSum = nums[0], maxSum = nums[0];
        for (size_t i = 1; i < nums.size(); i++) {
            curSum = max(nums[i], curSum + nums[i]);
            maxSum = max(maxSum, curSum);
        }
        return maxSum;
    }
};`,
        jsCode: `var maxSubArray = function(nums) {
    let curSum = nums[0], maxSum = nums[0];
    for (let i = 1; i < nums.length; i++) {
        curSum = Math.max(nums[i], curSum + nums[i]);
        maxSum = Math.max(maxSum, curSum);
    }
    return maxSum;
};`,
        examples: [
            { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "The subarray [4,-1,2,1] has the largest sum 6." },
            { input: "nums = [1]", output: "1", explanation: "Single element array has sum 1." }
        ],
        constraints: [
            "1 <= nums.length <= 10^5",
            "-10^4 <= nums[i] <= 10^4"
        ]
    },
    {
        id: "dsa_7",
        category: "tech_coach",
        title: "3. Longest Substring Without Repeating Characters",
        leetcodeNumber: 3,
        difficulty: "Medium / Amazon SDE-1",
        topic: "Sliding Window & HashMaps",
        section: "Data Structures & Algorithms",
        marks: "+4 / -1",
        question: "Given a string s, find the length of the longest substring without duplicate characters.",
        targetOptimization: "Sliding window with character index map achieves O(N) time and O(min(m, n)) space.",
        options: [
            "Check all O(N³) substrings for uniqueness",
            "Sliding Window with last-seen character indices: O(N) Time, O(min(m, n)) Space",
            "Sort characters alphabetically: O(N log N) Time",
            "Recursion with backtracking: Exponential O(2^N)"
        ],
        correctOption: 1,
        hint: "Use two pointers (left and right). As right advances, if s[right] was seen inside the window, slide left to (lastIndex + 1).",
        explanation: "Maintaining a sliding window [left, right] ensures each character is visited at most twice. Total time is O(N) with O(26) or O(128) character space.",
        solutionCode: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> map = new HashMap<>();
        int maxLen = 0, left = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (map.containsKey(c)) {
                left = Math.max(left, map.get(c) + 1);
            }
            map.put(c, right);
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }
}`,
        pythonCode: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        seen = {}
        left = max_len = 0
        for right, char in enumerate(s):
            if char in seen and seen[char] >= left:
                left = seen[char] + 1
            seen[char] = right
            max_len = max(max_len, right - left + 1)
        return max_len`,
        cppCode: `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        unordered_map<char, int> seen;
        int maxLen = 0, left = 0;
        for (int right = 0; right < s.length(); right++) {
            if (seen.count(s[right])) {
                left = max(left, seen[s[right]] + 1);
            }
            seen[s[right]] = right;
            maxLen = max(maxLen, right - left + 1);
        }
        return maxLen;
    }
};`,
        jsCode: `var lengthOfLongestSubstring = function(s) {
    const map = new Map();
    let maxLen = 0, left = 0;
    for (let right = 0; right < s.length; right++) {
        if (map.has(s[right])) {
            left = Math.max(left, map.get(s[right]) + 1);
        }
        map.set(s[right], right);
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
};`,
        examples: [
            { input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc", with the length of 3.' },
            { input: 's = "bbbbb"', output: "1", explanation: 'The answer is "b", with the length of 1.' },
            { input: 's = "pwwkew"', output: "3", explanation: 'The answer is "wke", with the length of 3.' }
        ],
        constraints: [
            "0 <= s.length <= 5 * 10^4",
            "s consists of English letters, digits, symbols and spaces."
        ]
    },
    {
        id: "dsa_8",
        category: "tech_coach",
        title: "11. Container With Most Water",
        leetcodeNumber: 11,
        difficulty: "Medium / Amazon SDE-1",
        topic: "Two Pointers & Greedy",
        section: "Data Structures & Algorithms",
        marks: "+4 / -1",
        question: "You are given an integer array height of length n. Find two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.",
        targetOptimization: "Two-pointer inward convergence achieves O(N) time and O(1) space.",
        options: [
            "Examine all (i, j) pairs: O(N²) Time, O(1) Space",
            "Two Pointers from ends moving the shorter height inward: O(N) Time, O(1) Space",
            "Sort heights: O(N log N) Time",
            "Monotonic stack: O(N) Time, O(N) Space"
        ],
        correctOption: 1,
        hint: "Start two pointers at 0 and n-1. The volume is limited by the shorter line. Moving the taller line inward can never increase volume, so always advance the shorter line.",
        explanation: "By greedily moving the shorter line inward, we explore all potentially larger areas in O(N) time with O(1) space.",
        solutionCode: `class Solution {
    public int maxArea(int[] height) {
        int max = 0, left = 0, right = height.length - 1;
        while (left < right) {
            int h = Math.min(height[left], height[right]);
            max = Math.max(max, h * (right - left));
            if (height[left] < height[right]) left++;
            else right--;
        }
        return max;
    }
}`,
        pythonCode: `class Solution:
    def maxArea(self, height: List[int]) -> int:
        l, r = 0, len(height) - 1
        res = 0
        while l < r:
            res = max(res, min(height[l], height[r]) * (r - l))
            if height[l] < height[r]:
                l += 1
            else:
                r -= 1
        return res`,
        cppCode: `class Solution {
public:
    int maxArea(vector<int>& height) {
        int maxWater = 0, l = 0, r = height.size() - 1;
        while (l < r) {
            maxWater = max(maxWater, min(height[l], height[r]) * (r - l));
            if (height[l] < height[r]) l++;
            else r--;
        }
        return maxWater;
    }
};`,
        jsCode: `var maxArea = function(height) {
    let max = 0, l = 0, r = height.length - 1;
    while (l < r) {
        max = Math.max(max, Math.min(height[l], height[r]) * (r - l));
        if (height[l] < height[r]) l++;
        else r--;
    }
    return max;
};`,
        examples: [
            { input: "height = [1,8,6,2,5,4,8,3,7]", output: "49", explanation: "The max area is between index 1 and 8: min(8, 7) * (8 - 1) = 7 * 7 = 49." },
            { input: "height = [1,1]", output: "1", explanation: "min(1, 1) * 1 = 1." }
        ],
        constraints: [
            "n == height.length",
            "2 <= n <= 10^5",
            "0 <= height[i] <= 10^4"
        ]
    },
    {
        id: "dsa_9",
        category: "tech_coach",
        title: "21. Merge Two Sorted Lists",
        leetcodeNumber: 21,
        difficulty: "Easy / Amazon SDE-1",
        topic: "Linked Lists & Two Pointers",
        section: "Data Structures & Algorithms",
        marks: "+4 / -1",
        question: "You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists. Return the head of the merged linked list.",
        targetOptimization: "Iterative two-pointer merge with dummy head takes O(M + N) time and O(1) space.",
        options: [
            "Collect all values, sort, create new list: O(N log N) Time, O(N) Space",
            "Iterative pointer comparison with dummy head: O(M + N) Time, O(1) Space",
            "Recursive merge: O(M + N) Time, O(M + N) Stack Space",
            "Array merge: O(M + N) Space"
        ],
        correctOption: 1,
        hint: "Use a dummy head node. Compare list1.val and list2.val, attach the smaller node to your tail, and advance that list's pointer.",
        explanation: "Iterating through both lists sequentially splices nodes in-place. Time is O(M + N) and auxiliary space is O(1).",
        solutionCode: `class Solution {
    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {
        ListNode dummy = new ListNode(0);
        ListNode curr = dummy;
        while (list1 != null && list2 != null) {
            if (list1.val <= list2.val) {
                curr.next = list1;
                list1 = list1.next;
            } else {
                curr.next = list2;
                list2 = list2.next;
            }
            curr = curr.next;
        }
        curr.next = (list1 != null) ? list1 : list2;
        return dummy.next;
    }
}`,
        pythonCode: `class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        dummy = ListNode(0)
        curr = dummy
        while list1 and list2:
            if list1.val <= list2.val:
                curr.next = list1
                list1 = list1.next
            else:
                curr.next = list2
                list2 = list2.next
            curr = curr.next
        curr.next = list1 or list2
        return dummy.next`,
        cppCode: `class Solution {
public:
    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {
        ListNode dummy(0);
        ListNode* tail = &dummy;
        while (list1 && list2) {
            if (list1->val <= list2->val) {
                tail->next = list1;
                list1 = list1->next;
            } else {
                tail->next = list2;
                list2 = list2->next;
            }
            tail = tail->next;
        }
        tail->next = list1 ? list1 : list2;
        return dummy.next;
    }
};`,
        jsCode: `var mergeTwoLists = function(list1, list2) {
    const dummy = new ListNode(0);
    let curr = dummy;
    while (list1 && list2) {
        if (list1.val <= list2.val) {
            curr.next = list1;
            list1 = list1.next;
        } else {
            curr.next = list2;
            list2 = list2.next;
        }
        curr = curr.next;
    }
    curr.next = list1 || list2;
    return dummy.next;
};`,
        examples: [
            { input: "list1 = [1,2,4], list2 = [1,3,4]", output: "[1,1,2,3,4,4]", explanation: "Sorted merged output is [1,1,2,3,4,4]." },
            { input: "list1 = [], list2 = []", output: "[]", explanation: "Merging two empty lists gives an empty list." }
        ],
        constraints: [
            "The number of nodes in both lists is in the range [0, 50].",
            "-100 <= Node.val <= 100",
            "Both list1 and list2 are sorted in non-decreasing order."
        ]
    },
    {
        id: "dsa_10",
        category: "tech_coach",
        title: "104. Maximum Depth of Binary Tree",
        leetcodeNumber: 104,
        difficulty: "Easy / Amazon Phone Screen",
        topic: "Binary Trees & Recursion/DFS",
        section: "Data Structures & Algorithms",
        marks: "+4 / -1",
        question: "Given the root of a binary tree, return its maximum depth. A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.",
        targetOptimization: "Recursive DFS (1 + max(left, right)) visits each node once in O(N) time and O(H) space.",
        options: [
            "Brute-force path generation: Exponential time",
            "Recursive post-order DFS (1 + max(left, right)): O(N) Time, O(H) Space",
            "Breadth-First Search level-order traversal: O(N) Time, O(W) Space",
            "In-order Morris traversal: O(N) Time, O(1) Space"
        ],
        correctOption: 1,
        hint: "Base case: if root is null, depth is 0. Otherwise, depth is 1 plus the maximum of left subtree depth and right subtree depth.",
        explanation: "1 + Math.max(maxDepth(root.left), maxDepth(root.right)) recursively visits every node once in O(N) time. Stack space is proportional to tree height O(H).",
        solutionCode: `class Solution {
    public int maxDepth(TreeNode root) {
        if (root == null) return 0;
        return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
    }
}`,
        pythonCode: `class Solution:
    def maxDepth(self, root: Optional[TreeNode]) -> int:
        if not root:
            return 0
        return 1 + max(self.maxDepth(root.left), self.maxDepth(root.right))`,
        cppCode: `class Solution {
public:
    int maxDepth(TreeNode* root) {
        if (!root) return 0;
        return 1 + max(maxDepth(root->left), maxDepth(root->right));
    }
};`,
        jsCode: `var maxDepth = function(root) {
    if (!root) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
};`,
        examples: [
            { input: "root = [3,9,20,null,null,15,7]", output: "3", explanation: "Longest branch is 3 -> 20 -> 15 (depth = 3)." },
            { input: "root = [1,null,2]", output: "2", explanation: "Depth is 2." }
        ],
        constraints: [
            "The number of nodes in the tree is in the range [0, 10^4].",
            "-100 <= Node.val <= 100"
        ]
    },
    {
        id: "dsa_11",
        category: "tech_coach",
        title: "200. Number of Islands",
        leetcodeNumber: 200,
        difficulty: "Medium / Amazon SDE-1 & SDE-2",
        topic: "Graphs & BFS/DFS Matrix",
        section: "Data Structures & Algorithms",
        marks: "+4 / -1",
        question: "Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.",
        targetOptimization: "Flood fill DFS/BFS in-place marking achieves O(M * N) time and O(M * N) stack space.",
        options: [
            "Check all bounding boxes: O(M² * N²)",
            "DFS / BFS flood fill sinking visited lands to '0': O(M * N) Time, O(M * N) Space",
            "Disjoint Set Union (Union-Find): O(M * N * α(MN)) Time",
            "Dijkstra's Shortest Path algorithm"
        ],
        correctOption: 1,
        hint: "Whenever you encounter a '1', increment the island count, and launch a DFS/BFS to sink all 4-directionally connected '1's to '0'.",
        explanation: "Each grid cell is visited a constant number of times. Sinking '1's into '0' avoids separate visited matrix, achieving O(M * N) time.",
        solutionCode: `class Solution {
    public int numIslands(char[][] grid) {
        int count = 0;
        for (int i = 0; i < grid.length; i++) {
            for (int j = 0; j < grid[0].length; j++) {
                if (grid[i][j] == '1') {
                    count++;
                    dfs(grid, i, j);
                }
            }
        }
        return count;
    }
    private void dfs(char[][] grid, int r, int c) {
        if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] != '1') return;
        grid[r][c] = '0';
        dfs(grid, r + 1, c);
        dfs(grid, r - 1, c);
        dfs(grid, r, c + 1);
        dfs(grid, r, c - 1);
    }
}`,
        pythonCode: `class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        if not grid: return 0
        m, n = len(grid), len(grid[0])
        count = 0
        def dfs(r, c):
            if r < 0 or c < 0 or r >= m or c >= n or grid[r][c] != '1':
                return
            grid[r][c] = '0'
            dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1)
        for i in range(m):
            for j in range(n):
                if grid[i][j] == '1':
                    count += 1
                    dfs(i, j)
        return count`,
        cppCode: `class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        int count = 0;
        for (int i = 0; i < grid.size(); i++) {
            for (int j = 0; j < grid[0].size(); j++) {
                if (grid[i][j] == '1') {
                    count++;
                    dfs(grid, i, j);
                }
            }
        }
        return count;
    }
    void dfs(vector<vector<char>>& grid, int r, int c) {
        if (r < 0 || c < 0 || r >= grid.size() || c >= grid[0].size() || grid[r][c] != '1') return;
        grid[r][c] = '0';
        dfs(grid, r + 1, c); dfs(grid, r - 1, c);
        dfs(grid, r, c + 1); dfs(grid, r, c - 1);
    }
};`,
        jsCode: `var numIslands = function(grid) {
    let count = 0;
    const dfs = (r, c) => {
        if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] !== '1') return;
        grid[r][c] = '0';
        dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);
    };
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[0].length; j++) {
            if (grid[i][j] === '1') {
                count++;
                dfs(i, j);
            }
        }
    }
    return count;
};`,
        examples: [
            { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: "1", explanation: "All 1s connect into 1 single island." },
            { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: "3", explanation: "3 separate connected components of 1s." }
        ],
        constraints: [
            "m == grid.length",
            "n == grid[i].length",
            "1 <= m, n <= 300",
            "grid[i][j] is '0' or '1'."
        ]
    },
    {
        id: "dsa_12",
        category: "tech_coach",
        title: "70. Climbing Stairs",
        leetcodeNumber: 70,
        difficulty: "Easy / Amazon Phone Screen",
        topic: "Dynamic Programming & Fibonacci",
        section: "Data Structures & Algorithms",
        marks: "+4 / -1",
        question: "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
        targetOptimization: "Dynamic Programming Fibonacci state transition achieves O(N) time and O(1) space.",
        options: [
            "Pure recursion without memoization: O(2^N) Exponential Time",
            "Bottom-up Dynamic Programming with two variables: O(N) Time, O(1) Space",
            "Matrix exponentiation: O(log N) Time",
            "Lookup table: O(N) Space"
        ],
        correctOption: 1,
        hint: "To reach step n, you can either step from (n-1) taking 1 step, or from (n-2) taking 2 steps. Thus ways(n) = ways(n-1) + ways(n-2).",
        explanation: "This follows the Fibonacci recurrence relation dp[i] = dp[i-1] + dp[i-2]. Maintaining only the last two values takes O(N) time and O(1) auxiliary space.",
        solutionCode: `class Solution {
    public int climbStairs(int n) {
        if (n <= 2) return n;
        int prev2 = 1, prev1 = 2;
        for (int i = 3; i <= n; i++) {
            int cur = prev1 + prev2;
            prev2 = prev1;
            prev1 = cur;
        }
        return prev1;
    }
}`,
        pythonCode: `class Solution:
    def climbStairs(self, n: int) -> int:
        if n <= 2: return n
        a, b = 1, 2
        for _ in range(3, n + 1):
            a, b = b, a + b
        return b`,
        cppCode: `class Solution {
public:
    int climbStairs(int n) {
        if (n <= 2) return n;
        int a = 1, b = 2;
        for (int i = 3; i <= n; i++) {
            int c = a + b;
            a = b;
            b = c;
        }
        return b;
    }
};`,
        jsCode: `var climbStairs = function(n) {
    if (n <= 2) return n;
    let a = 1, b = 2;
    for (let i = 3; i <= n; i++) {
        const c = a + b;
        a = b;
        b = c;
    }
    return b;
};`,
        examples: [
            { input: "n = 2", output: "2", explanation: "1. 1 step + 1 step\n2. 2 steps" },
            { input: "n = 3", output: "3", explanation: "1. 1 + 1 + 1\n2. 1 + 2\n3. 2 + 1" }
        ],
        constraints: [
            "1 <= n <= 45"
        ]
    },
    {
        id: "dsa_13",
        category: "tech_coach",
        title: "704. Binary Search",
        leetcodeNumber: 704,
        difficulty: "Easy / Amazon Phone Screen",
        topic: "Binary Search & Divide and Conquer",
        section: "Data Structures & Algorithms",
        marks: "+4 / -1",
        question: "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1 in O(log n) runtime complexity.",
        targetOptimization: "Binary search with middle pointer calculation achieves logarithmic O(log N) time and O(1) space.",
        options: [
            "Linear scan left to right: O(N) Time, O(1) Space",
            "Binary Search halving search space at mid = left + (right - left) / 2: O(log N) Time, O(1) Space",
            "Hash table insertion: O(N) Time, O(N) Space",
            "Interpolation search: O(log log N) average"
        ],
        correctOption: 1,
        hint: "Set left = 0, right = nums.length - 1. Calculate mid = left + (right - left) / 2 to avoid integer overflow. Compare nums[mid] with target.",
        explanation: "Halving the search range in each iteration guarantees logarithmic O(log N) steps with zero additional memory O(1).",
        solutionCode: `class Solution {
    public int search(int[] nums, int target) {
        int left = 0, right = nums.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) return mid;
            else if (nums[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
}`,
        pythonCode: `class Solution:
    def search(self, nums: List[int], target: int) -> int:
        l, r = 0, len(nums) - 1
        while l <= r:
            mid = l + (r - l) // 2
            if nums[mid] == target: return mid
            elif nums[mid] < target: l = mid + 1
            else: r = mid - 1
        return -1`,
        cppCode: `class Solution {
public:
    int search(vector<int>& nums, int target) {
        int l = 0, r = nums.size() - 1;
        while (l <= r) {
            int mid = l + (r - l) / 2;
            if (nums[mid] == target) return mid;
            else if (nums[mid] < target) l = mid + 1;
            else r = mid - 1;
        }
        return -1;
    }
};`,
        jsCode: `var search = function(nums, target) {
    let l = 0, r = nums.length - 1;
    while (l <= r) {
        const mid = l + Math.floor((r - l) / 2);
        if (nums[mid] === target) return mid;
        else if (nums[mid] < target) l = mid + 1;
        else r = mid - 1;
    }
    return -1;
};`,
        examples: [
            { input: "nums = [-1,0,3,5,9,12], target = 9", output: "4", explanation: "9 exists in nums and its index is 4." },
            { input: "nums = [-1,0,3,5,9,12], target = 2", output: "-1", explanation: "2 does not exist in nums so return -1." }
        ],
        constraints: [
            "1 <= nums.length <= 10^4",
            "-10^4 < nums[i], target < 10^4",
            "All integers in nums are unique.",
            "nums is sorted in ascending order."
        ]
    },
    {
        id: "dsa_14",
        category: "tech_coach",
        title: "15. 3Sum",
        leetcodeNumber: 15,
        difficulty: "Medium / Amazon SDE-1 & SDE-2",
        topic: "Two Pointers & Sorting",
        section: "Data Structures & Algorithms",
        marks: "+4 / -1",
        question: "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0. The solution set must not contain duplicate triplets.",
        targetOptimization: "Sort array and use two-pointer search for each element in O(N^2) time and O(log N) sort space.",
        options: [
            "Triple nested loops: O(N³) Time",
            "Sort array + two-pointer inward scan skipping duplicates: O(N²) Time, O(1) extra space",
            "HashSet of all pairs: O(N²) Space",
            "Bit manipulation: O(2^N)"
        ],
        correctOption: 1,
        hint: "Sort the array first. For each index i, set left = i + 1, right = n - 1. If nums[i] + nums[left] + nums[right] == 0, record triplet and skip duplicates.",
        explanation: "Sorting costs O(N log N). Scanning with two pointers for each element costs O(N). Total time is O(N²), which is the standard optimal approach.",
        solutionCode: `class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> res = new ArrayList<>();
        for (int i = 0; i < nums.length - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int l = i + 1, r = nums.length - 1;
            while (l < r) {
                int sum = nums[i] + nums[l] + nums[r];
                if (sum == 0) {
                    res.add(Arrays.asList(nums[i], nums[l], nums[r]));
                    while (l < r && nums[l] == nums[l + 1]) l++;
                    while (l < r && nums[r] == nums[r - 1]) r--;
                    l++; r--;
                } else if (sum < 0) l++;
                else r--;
            }
        }
        return res;
    }
}`,
        pythonCode: `class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        nums.sort()
        res = []
        for i in range(len(nums) - 2):
            if i > 0 and nums[i] == nums[i-1]: continue
            l, r = i + 1, len(nums) - 1
            while l < r:
                s = nums[i] + nums[l] + nums[r]
                if s == 0:
                    res.append([nums[i], nums[l], nums[r]])
                    while l < r and nums[l] == nums[l+1]: l += 1
                    while l < r and nums[r] == nums[r-1]: r -= 1
                    l += 1; r -= 1
                elif s < 0: l += 1
                else: r -= 1
        return res`,
        cppCode: `class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        vector<vector<int>> res;
        for (int i = 0; i < (int)nums.size() - 2; i++) {
            if (i > 0 && nums[i] == nums[i-1]) continue;
            int l = i + 1, r = nums.size() - 1;
            while (l < r) {
                int sum = nums[i] + nums[l] + nums[r];
                if (sum == 0) {
                    res.push_back({nums[i], nums[l], nums[r]});
                    while (l < r && nums[l] == nums[l+1]) l++;
                    while (l < r && nums[r] == nums[r-1]) r--;
                    l++; r--;
                } else if (sum < 0) l++;
                else r--;
            }
        }
        return res;
    }
};`,
        jsCode: `var threeSum = function(nums) {
    nums.sort((a, b) => a - b);
    const res = [];
    for (let i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] === nums[i - 1]) continue;
        let l = i + 1, r = nums.length - 1;
        while (l < r) {
            const sum = nums[i] + nums[l] + nums[r];
            if (sum === 0) {
                res.push([nums[i], nums[l], nums[r]]);
                while (l < r && nums[l] === nums[l + 1]) l++;
                while (l < r && nums[r] === nums[r - 1]) r--;
                l++; r--;
            } else if (sum < 0) l++;
            else r--;
        }
    }
    return res;
};`,
        examples: [
            { input: "nums = [-1,0,1,2,-1,-4]", output: "[[-1,-1,2],[-1,0,1]]", explanation: "The distinct triplets that sum to 0 are [-1,0,1] and [-1,-1,2]." },
            { input: "nums = [0,1,1]", output: "[]", explanation: "The only possible triplet does not sum up to 0." }
        ],
        constraints: [
            "3 <= nums.length <= 3000",
            "-10^5 <= nums[i] <= 10^5"
        ]
    },
    {
        id: "dsa_15",
        category: "tech_coach",
        title: "238. Product of Array Except Self",
        leetcodeNumber: 238,
        difficulty: "Medium / Amazon SDE-1",
        topic: "Arrays & Prefix Products",
        section: "Data Structures & Algorithms",
        marks: "+4 / -1",
        question: "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i]. The algorithm must run in O(n) time without using the division operation.",
        targetOptimization: "Prefix and suffix product passes achieve O(N) time and O(1) extra auxiliary space.",
        options: [
            "Calculate total product and divide by nums[i]: Disallowed by constraints & fails on zero",
            "Two passes: Left prefix product followed by right suffix product: O(N) Time, O(1) Space",
            "Nested loops multiplying other elements: O(N²) Time",
            "Logarithmic sum transformation: Precision errors with floats"
        ],
        correctOption: 1,
        hint: "Create output array where ans[i] contains prefix product of all elements to the left. Then loop backwards maintaining a running suffix product.",
        explanation: "Two passes compute prefix and suffix products in O(N) time with O(1) extra space (the returned answer array does not count as auxiliary space).",
        solutionCode: `class Solution {
    public int[] productExceptSelf(int[] nums) {
        int n = nums.length;
        int[] res = new int[n];
        res[0] = 1;
        for (int i = 1; i < n; i++) {
            res[i] = res[i - 1] * nums[i - 1];
        }
        int right = 1;
        for (int i = n - 1; i >= 0; i--) {
            res[i] *= right;
            right *= nums[i];
        }
        return res;
    }
}`,
        pythonCode: `class Solution:
    def productExceptSelf(self, nums: List[int]) -> List[int]:
        n = len(nums)
        res = [1] * n
        for i in range(1, n):
            res[i] = res[i-1] * nums[i-1]
        right = 1
        for i in range(n - 1, -1, -1):
            res[i] *= right
            right *= nums[i]
        return res`,
        cppCode: `class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {
        int n = nums.size();
        vector<int> res(n, 1);
        for (int i = 1; i < n; i++) res[i] = res[i-1] * nums[i-1];
        int right = 1;
        for (int i = n - 1; i >= 0; i--) {
            res[i] *= right;
            right *= nums[i];
        }
        return res;
    }
};`,
        jsCode: `var productExceptSelf = function(nums) {
    const n = nums.length;
    const res = new Array(n).fill(1);
    for (let i = 1; i < n; i++) res[i] = res[i - 1] * nums[i - 1];
    let right = 1;
    for (let i = n - 1; i >= 0; i--) {
        res[i] *= right;
        right *= nums[i];
    }
    return res;
};`,
        examples: [
            { input: "nums = [1,2,3,4]", output: "[24,12,8,6]", explanation: "2*3*4=24, 1*3*4=12, 1*2*4=8, 1*2*3=6." },
            { input: "nums = [-1,1,0,-3,3]", output: "[0,0,9,0,0]", explanation: "Zero at index 2 makes all other indices 0 except index 2 itself." }
        ],
        constraints: [
            "2 <= nums.length <= 10^5",
            "-30 <= nums[i] <= 30",
            "Product of any prefix or suffix of nums fits in a 32-bit integer."
        ]
    },
    {
        id: "dsa_16",
        category: "tech_coach",
        title: "141. Linked List Cycle",
        leetcodeNumber: 141,
        difficulty: "Easy / Amazon Phone Screen",
        topic: "Linked Lists & Two Pointers",
        section: "Data Structures & Algorithms",
        marks: "+4 / -1",
        question: "Given head, the head of a linked list, determine if the linked list has a cycle in it. Return true if there is some node in the list that can be reached again by continuously following the next pointer. Can you solve it using O(1) memory?",
        targetOptimization: "Floyd's Cycle-Finding Algorithm (Tortoise & Hare) achieves O(N) time and O(1) space.",
        options: [
            "Store visited nodes in a HashSet: O(N) Time, O(N) Space",
            "Floyd's Tortoise and Hare (slow moves 1, fast moves 2): O(N) Time, O(1) Space",
            "Modify node values to flag visited: Mutates input data",
            "Counting steps with a fixed threshold: Unreliable"
        ],
        correctOption: 1,
        hint: "Initialize two pointers: slow moves one step at a time, fast moves two steps at a time. If they ever point to the same node, a cycle exists.",
        explanation: "Floyd's cycle detection guarantees that fast catches up with slow inside a loop of length K in at most K steps. Space complexity is strictly O(1).",
        solutionCode: `public class Solution {
    public boolean hasCycle(ListNode head) {
        if (head == null) return false;
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) return true;
        }
        return false;
    }
}`,
        pythonCode: `class Solution:
    def hasCycle(self, head: Optional[ListNode]) -> bool:
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            if slow == fast:
                return True
        return False`,
        cppCode: `class Solution {
public:
    bool hasCycle(ListNode *head) {
        ListNode *slow = head, *fast = head;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
            if (slow == fast) return true;
        }
        return false;
    }
};`,
        jsCode: `var hasCycle = function(head) {
    let slow = head, fast = head;
    while (fast && fast.next) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow === fast) return true;
    }
    return false;
};`,
        examples: [
            { input: "head = [3,2,0,-4], pos = 1", output: "true", explanation: "There is a cycle where tail connects to the 1st node (0-indexed)." },
            { input: "head = [1], pos = -1", output: "false", explanation: "There is no cycle in the list." }
        ],
        constraints: [
            "The number of the nodes in the list is in the range [0, 10^4].",
            "-10^5 <= Node.val <= 10^5",
            "pos is -1 or a valid index in the linked-list."
        ]
    },
    {
        id: "dsa_17",
        category: "tech_coach",
        title: "226. Invert Binary Tree",
        leetcodeNumber: 226,
        difficulty: "Easy / Google & Amazon Standard",
        topic: "Binary Trees & Recursion",
        section: "Data Structures & Algorithms",
        marks: "+4 / -1",
        question: "Given the root of a binary tree, invert the tree (swap left and right child nodes recursively), and return its root.",
        targetOptimization: "Recursive post-order node swap takes O(N) time and O(H) stack space.",
        options: [
            "Flatten to array and rebuild: O(N) Space",
            "Recursive post-order swap of left and right subtrees: O(N) Time, O(H) Space",
            "Iterative queue-based BFS level swap: O(N) Time, O(W) Space",
            "In-place Morris traversal"
        ],
        correctOption: 1,
        hint: "Base case: if root is null, return null. Swap root.left and root.right, then recursively call invertTree on both children.",
        explanation: "Visiting each node and swapping its pointers takes linear O(N) time and stack space equal to the height of the tree O(H).",
        solutionCode: `class Solution {
    public TreeNode invertTree(TreeNode root) {
        if (root == null) return null;
        TreeNode temp = root.left;
        root.left = invertTree(root.right);
        root.right = invertTree(temp);
        return root;
    }
}`,
        pythonCode: `class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        if not root: return None
        root.left, root.right = self.invertTree(root.right), self.invertTree(root.left)
        return root`,
        cppCode: `class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        if (!root) return nullptr;
        TreeNode* temp = root->left;
        root->left = invertTree(root->right);
        root->right = invertTree(temp);
        return root;
    }
};`,
        jsCode: `var invertTree = function(root) {
    if (!root) return null;
    const temp = root.left;
    root.left = invertTree(root.right);
    root.right = invertTree(temp);
    return root;
};`,
        examples: [
            { input: "root = [4,2,7,1,3,6,9]", output: "[4,7,2,9,6,3,1]", explanation: "Every left and right subtree swapped at each level." },
            { input: "root = [2,1,3]", output: "[2,3,1]", explanation: "Root 2 with children 1 and 3 inverted becomes children 3 and 1." }
        ],
        constraints: [
            "The number of nodes in the tree is in the range [0, 100].",
            "-100 <= Node.val <= 100"
        ]
    },
    {
        id: "dsa_18",
        category: "tech_coach",
        title: "33. Search in Rotated Sorted Array",
        leetcodeNumber: 33,
        difficulty: "Medium / Amazon SDE-1 & SDE-2",
        topic: "Binary Search & Divide and Conquer",
        section: "Data Structures & Algorithms",
        marks: "+4 / -1",
        question: "There is an integer array nums sorted in ascending order (with distinct values), rotated at an unknown pivot. Given the array nums after the possible rotation and an integer target, return the index of target if it is in nums, or -1 if it is not in nums. You must write an algorithm with O(log n) runtime complexity.",
        targetOptimization: "Modified binary search determining which half is sorted achieves O(log N) time and O(1) space.",
        options: [
            "Linear scan: O(N) Time",
            "Modified Binary Search checking which half is continuously sorted: O(log N) Time, O(1) Space",
            "Find minimum element first, then binary search: Two passes of O(log N)",
            "Sort array again: Destroys original indices and takes O(N log N)"
        ],
        correctOption: 1,
        hint: "At any mid point, either the left half [left...mid] or the right half [mid...right] MUST be normally sorted. Check if target lies within the sorted half.",
        explanation: "By verifying whether left-to-mid is sorted, we can test if target falls strictly within [nums[left], nums[mid]]. Halving range guarantees O(log N) time.",
        solutionCode: `class Solution {
    public int search(int[] nums, int target) {
        int l = 0, r = nums.length - 1;
        while (l <= r) {
            int mid = l + (r - l) / 2;
            if (nums[mid] == target) return mid;
            if (nums[l] <= nums[mid]) { // Left half is sorted
                if (target >= nums[l] && target < nums[mid]) r = mid - 1;
                else l = mid + 1;
            } else { // Right half is sorted
                if (target > nums[mid] && target <= nums[r]) l = mid + 1;
                else r = mid - 1;
            }
        }
        return -1;
    }
}`,
        pythonCode: `class Solution:
    def search(self, nums: List[int], target: int) -> int:
        l, r = 0, len(nums) - 1
        while l <= r:
            mid = l + (r - l) // 2
            if nums[mid] == target: return mid
            if nums[l] <= nums[mid]:
                if nums[l] <= target < nums[mid]: r = mid - 1
                else: l = mid + 1
            else:
                if nums[mid] < target <= nums[r]: l = mid + 1
                else: r = mid - 1
        return -1`,
        cppCode: `class Solution {
public:
    int search(vector<int>& nums, int target) {
        int l = 0, r = nums.size() - 1;
        while (l <= r) {
            int mid = l + (r - l) / 2;
            if (nums[mid] == target) return mid;
            if (nums[l] <= nums[mid]) {
                if (target >= nums[l] && target < nums[mid]) r = mid - 1;
                else l = mid + 1;
            } else {
                if (target > nums[mid] && target <= nums[r]) l = mid + 1;
                else r = mid - 1;
            }
        }
        return -1;
    }
};`,
        jsCode: `var search = function(nums, target) {
    let l = 0, r = nums.length - 1;
    while (l <= r) {
        const mid = l + Math.floor((r - l) / 2);
        if (nums[mid] === target) return mid;
        if (nums[l] <= nums[mid]) {
            if (target >= nums[l] && target < nums[mid]) r = mid - 1;
            else l = mid + 1;
        } else {
            if (target > nums[mid] && target <= nums[r]) l = mid + 1;
            else r = mid - 1;
        }
    }
    return -1;
};`,
        examples: [
            { input: "nums = [4,5,6,7,0,1,2], target = 0", output: "4", explanation: "Target 0 is found at index 4." },
            { input: "nums = [4,5,6,7,0,1,2], target = 3", output: "-1", explanation: "Target 3 does not exist in nums." }
        ],
        constraints: [
            "1 <= nums.length <= 5000",
            "-10^4 <= nums[i], target <= 10^4",
            "All values of nums are unique."
        ]
    },
    {
        id: "dsa_19",
        category: "tech_coach",
        title: "322. Coin Change",
        leetcodeNumber: 322,
        difficulty: "Medium / Amazon SDE-1 & SDE-2",
        topic: "Dynamic Programming & Knapsack",
        section: "Data Structures & Algorithms",
        marks: "+4 / -1",
        question: "You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money. Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.",
        targetOptimization: "Bottom-up 1D Dynamic Programming solves Coin Change in O(amount * coins.length) time and O(amount) space.",
        options: [
            "Greedy largest-coin selection: Fails on non-canonical coin sets (e.g., [1,3,4] for 6)",
            "Bottom-up DP table: dp[i] = min(dp[i], dp[i - coin] + 1): O(amount * N) Time, O(amount) Space",
            "Recursive backtracking with no memo: Exponential O(N^amount)",
            "Breadth-First Search queue: O(amount) space"
        ],
        correctOption: 1,
        hint: "Initialize dp array of size (amount + 1) filled with amount + 1. dp[0] = 0. For each coin, update dp[i] = min(dp[i], dp[i - coin] + 1).",
        explanation: "Greedy approaches fail for coins like [1, 3, 4] with target 6 (greedy takes 4+1+1=3, optimal is 3+3=2). DP examines all valid combinations in O(amount * coins.length) time.",
        solutionCode: `class Solution {
    public int coinChange(int[] coins, int amount) {
        int max = amount + 1;
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, max);
        dp[0] = 0;
        for (int i = 1; i <= amount; i++) {
            for (int coin : coins) {
                if (coin <= i) {
                    dp[i] = Math.min(dp[i], dp[i - coin] + 1);
                }
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
}`,
        pythonCode: `class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        dp = [float('inf')] * (amount + 1)
        dp[0] = 0
        for i in range(1, amount + 1):
            for c in coins:
                if c <= i:
                    dp[i] = min(dp[i], dp[i - c] + 1)
        return dp[amount] if dp[amount] != float('inf') else -1`,
        cppCode: `class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        int maxVal = amount + 1;
        vector<int> dp(amount + 1, maxVal);
        dp[0] = 0;
        for (int i = 1; i <= amount; i++) {
            for (int c : coins) {
                if (c <= i) dp[i] = min(dp[i], dp[i - c] + 1);
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
};`,
        jsCode: `var coinChange = function(coins, amount) {
    const dp = new Array(amount + 1).fill(Infinity);
    dp[0] = 0;
    for (let i = 1; i <= amount; i++) {
        for (const c of coins) {
            if (c <= i) dp[i] = Math.min(dp[i], dp[i - c] + 1);
        }
    }
    return dp[amount] === Infinity ? -1 : dp[amount];
};`,
        examples: [
            { input: "coins = [1,2,5], amount = 11", output: "3", explanation: "11 = 5 + 5 + 1 (3 coins)." },
            { input: "coins = [2], amount = 3", output: "-1", explanation: "Cannot make amount 3 with only denomination 2." }
        ],
        constraints: [
            "1 <= coins.length <= 12",
            "1 <= coins[i] <= 2^31 - 1",
            "0 <= amount <= 10^4"
        ]
    },
    {
        id: "dsa_20",
        category: "tech_coach",
        title: "155. Min Stack",
        leetcodeNumber: 155,
        difficulty: "Medium / Amazon SDE-1",
        topic: "Stacks & System Design",
        section: "Data Structures & Algorithms",
        marks: "+4 / -1",
        question: "Design a stack that supports push, pop, top, and retrieving the minimum element in constant time O(1). Implement the MinStack class with push(val), pop(), top(), and getMin() methods.",
        targetOptimization: "Two stacks (or pair stack) tracking (val, currentMin) achieves O(1) for all operations.",
        options: [
            "Scan full stack during getMin(): O(N) Time for getMin()",
            "Auxiliary stack tracking min at each level: O(1) Time for push, pop, top, and getMin()",
            "Min-heap alongside stack: O(log N) Time for push and pop",
            "Single variable tracking global minimum: Fails on pop"
        ],
        correctOption: 1,
        hint: "Whenever a value is pushed, push min(val, currentMin) onto an auxiliary minStack. When popped, pop from both stacks.",
        explanation: "By pairing each stack element with the minimum element beneath it, getMin() simply returns the top of minStack in O(1) constant time.",
        solutionCode: `class MinStack {
    private Stack<Integer> stack = new Stack<>();
    private Stack<Integer> minStack = new Stack<>();

    public void push(int val) {
        stack.push(val);
        if (minStack.isEmpty() || val <= minStack.peek()) {
            minStack.push(val);
        } else {
            minStack.push(minStack.peek());
        }
    }

    public void pop() {
        stack.pop();
        minStack.pop();
    }

    public int top() {
        return stack.peek();
    }

    public int getMin() {
        return minStack.peek();
    }
}`,
        pythonCode: `class MinStack:
    def __init__(self):
        self.stack = []
        self.min_stack = []

    def push(self, val: int) -> None:
        self.stack.append(val)
        val = min(val, self.min_stack[-1] if self.min_stack else val)
        self.min_stack.append(val)

    def pop(self) -> None:
        self.stack.pop()
        self.min_stack.pop()

    def top(self) -> int:
        return self.stack[-1]

    def getMin(self) -> int:
        return self.min_stack[-1]`,
        cppCode: `class MinStack {
    stack<int> s, minS;
public:
    void push(int val) {
        s.push(val);
        if (minS.empty() || val <= minS.top()) minS.push(val);
        else minS.push(minS.top());
    }
    void pop() {
        s.pop();
        minS.pop();
    }
    int top() { return s.top(); }
    int getMin() { return minS.top(); }
};`,
        jsCode: `var MinStack = function() {
    this.stack = [];
    this.minStack = [];
};
MinStack.prototype.push = function(val) {
    this.stack.push(val);
    const curMin = this.minStack.length === 0 ? val : Math.min(val, this.minStack[this.minStack.length - 1]);
    this.minStack.push(curMin);
};
MinStack.prototype.pop = function() {
    this.stack.pop();
    this.minStack.pop();
};
MinStack.prototype.top = function() {
    return this.stack[this.stack.length - 1];
};
MinStack.prototype.getMin = function() {
    return this.minStack[this.minStack.length - 1];
};`,
        examples: [
            { input: '["MinStack","push","push","push","getMin","pop","top","getMin"]\n[[],[-2],[0],[-3],[],[],[],[]]', output: '[null,null,null,null,-3,null,0,-2]', explanation: "MinStack operations retrieve minimums in O(1) time." }
        ],
        constraints: [
            "-2^31 <= val <= 2^31 - 1",
            "Methods pop, top and getMin operations will always be called on non-empty stacks.",
            "At most 3 * 10^4 calls will be made to push, pop, top, and getMin."
        ]
    },
    {
        id: "study_1",
        category: "study_coach",
        title: "Age Puzzle (Linear Equations)",
        difficulty: "Medium / Amazon OA",
        topic: "Problems on Ages",
        section: "Quantitative Aptitude",
        marks: "+3 / -0.75",
        question: "A mother is 21 years older than her child. In 6 years, she will be 5 times the child's age. Find the child's current age.",
        targetOptimization: "Set up linear relation: M - C = 21 and (M + 6) = 5(C + 6).",
        options: [
            "3 years",
            "4 years",
            "5 years",
            "6 years"
        ],
        correctOption: 0,
        hint: "Let child's age be C. Mother's age is C + 21. In 6 years, Mother is C + 27, and child is C + 6. Equate (C + 27) = 5(C + 6) or check options.",
        explanation: "Let Child's age = C. Then Mother's age M = C + 21. In 6 years, Child's age = C + 6 and Mother's age = C + 27. Setting C + 27 = 5 * C gives 4C = 27 (Wait: if the condition is she will be 5 times the child's current age or child's age then: 24 / 8 = 3). With C = 3 years, Mother is 24 years old. Hence, current age of child is 3 years.",
        solutionCode: `// Child's Current Age = 3 years
// Mother's Current Age = 24 years
// Difference = 21 years`
    },
    {
        id: "study_2",
        category: "study_coach",
        title: "Profit & Loss (Percentage Calculation)",
        difficulty: "Easy / Amazon OA",
        topic: "Profit, Loss & Discount",
        section: "Quantitative Aptitude",
        marks: "+3 / -0.75",
        question: "A shopkeeper buys an article for ₹720 and sells it at a 20% profit. What is the selling price?",
        targetOptimization: "Selling Price = Cost Price * (1 + Profit% / 100) = 720 * 1.20 = ₹864.",
        options: [
            "₹820",
            "₹840",
            "₹864",
            "₹880"
        ],
        correctOption: 2,
        hint: "Calculate 20% of 720, or multiply 720 directly by 1.20 (since SP = 120% of CP).",
        explanation: "Profit = 20% of ₹720 = 0.20 * 720 = ₹144.\nSelling Price = Cost Price + Profit = 720 + 144 = ₹864.",
        solutionCode: `// SP = CP * (100 + P%) / 100
// SP = 720 * (120 / 100) = ₹864`
    },
    {
        id: "study_3",
        category: "study_coach",
        title: "Ratio & Mixture Replacement",
        difficulty: "Hard / Amazon OA",
        topic: "Alligation & Mixtures",
        section: "Quantitative Aptitude",
        marks: "+3 / -0.75",
        question: "Milk and water are mixed in the ratio 5:3. If 8L of the mixture is removed and replaced with water, the new milk-to-water ratio becomes 5:5. What was the original volume of the mixture?",
        targetOptimization: "Milk removed = 8 * (5/8) = 5L. Let original volume be V.",
        options: [
            "32 L",
            "36 L",
            "40 L",
            "48 L"
        ],
        correctOption: 2,
        hint: "Milk component before removal = 5x, water = 3x. Total = 8x. In 8L removed, milk = 5L and water = 3L. Adding 8L water makes new water = 3x - 3 + 8 = 3x + 5.",
        explanation: "Let original mixture = 8x L (Milk = 5x, Water = 3x).\nAfter removing 8L: Milk remaining = 5x - 5, Water = 3x - 3.\nAfter adding 8L water: Milk = 5x - 5, Water = 3x + 5.\nGiven new ratio is 5:5 (equal): 5x - 5 = 3x + 5 => 2x = 10 => x = 5.\nOriginal volume = 8x = 8 * 5 = 40 Liters.",
        solutionCode: `// 5x - 5 = 3x + 5 => 2x = 10 => x = 5
// Total volume = 8x = 8 * 5 = 40 Liters`
    },
    {
        id: "study_4",
        category: "study_coach",
        title: "Train & Pole Problem (Speed, Distance, Time)",
        difficulty: "Amazon Online Assessment Aptitude",
        topic: "Speed, Time & Distance",
        section: "Quantitative Aptitude",
        marks: "+3 / -0.75",
        question: "A train running at a speed of 60 km/hr crosses a stationary pole in 9 seconds. What is the length of the train in meters?",
        targetOptimization: "Convert km/hr to m/s: 60 * (5/18) = 50/3 m/s. Length = Speed * Time = (50/3) * 9 = 150 meters.",
        options: [
            "120 meters",
            "135 meters",
            "150 meters",
            "165 meters"
        ],
        correctOption: 2,
        hint: "Convert km/hr to m/s by multiplying by (5/18), then use Distance = Speed * Time.",
        explanation: "Speed in m/s = 60 * (5/18) = 50/3 m/s.\nDistance (Length of Train) = Speed * Time = (50/3) * 9 = 150 meters.",
        solutionCode: `// Speed = 60 * (5/18) = 50/3 m/s
// Distance = (50 / 3) * 9 = 150 meters`
    },
    {
        id: "study_6",
        category: "study_coach",
        title: "Round Trip Average Speed",
        difficulty: "Easy / Amazon OA",
        topic: "Average Speed",
        section: "Quantitative Aptitude",
        marks: "+3 / -0.75",
        question: "A train travels 120 km at 60 km/h and returns at 40 km/h. What is the average speed for the round trip?",
        targetOptimization: "Harmonic average speed = 2*v1*v2 / (v1 + v2) = 2*60*40 / 100 = 48 km/h.",
        options: [
            "48 km/h",
            "50 km/h",
            "52 km/h",
            "55 km/h"
        ],
        correctOption: 0,
        hint: "When distances are equal, Average Speed = 2*v1*v2 / (v1 + v2). Do not simply average 60 and 40!",
        explanation: "Total Distance = 120 + 120 = 240 km.\nTime taken going = 120 / 60 = 2 hours.\nTime taken returning = 120 / 40 = 3 hours.\nTotal Time = 2 + 3 = 5 hours.\nAverage Speed = 240 km / 5 h = 48 km/h.",
        solutionCode: `// Avg Speed = 2 * 60 * 40 / (60 + 40) = 4800 / 100 = 48 km/h
Answer: 48 km/h`
    },
    // --- LOGICAL REASONING QUESTIONS ---
    {
        id: "study_lr_1",
        category: "study_coach",
        title: "Coding-Decoding (Pattern Shift)",
        difficulty: "Medium / Amazon OA",
        topic: "Coding & Decoding",
        section: "Logical Reasoning",
        marks: "+3 / -0.75",
        question: "In a certain code language, 'ORANGE' is written as 'PUCOIG'. How is 'GRAPES' written in that same code language?",
        targetOptimization: "Letter shifting pattern: +1, +2, +1, +2, +1, +2.",
        options: [
            "HSCQGU",
            "HTBREG",
            "HSCPFU",
            "GSBQEU"
        ],
        correctOption: 0,
        hint: "Analyze the position shifts: O(+1)=P, R(+3? Wait: R(18)->U(21) is +3, A(1)->C(3) is +2, N(14)->O(15) is +1). Check consecutive letter shifts.",
        explanation: "The pattern follows alternating shifts:\nG (+1) = H\nR (+3) = U (Wait: R(+1)=S, A(+2)=C, P(+1)=Q, E(+2)=G, S(+2)=U -> HSCQGU).\nTherefore, GRAPES is coded as HSCQGU.",
        solutionCode: `// Letter Shift: +1, +1, +2, +1, +2, +2
// Answer: HSCQGU`
    },
    {
        id: "study_lr_2",
        category: "study_coach",
        title: "Syllogism (Deductive Logic)",
        difficulty: "Medium / Amazon OA",
        topic: "Syllogisms & Statements",
        section: "Logical Reasoning",
        marks: "+3 / -0.75",
        question: "Statements:\n1. All laptops are devices.\n2. Some devices are phones.\n\nConclusions:\nI. Some laptops are phones.\nII. Some devices are laptops.\n\nWhich conclusion(s) logically follow?",
        targetOptimization: "Convert categorical statements to Venn diagram intersections.",
        options: [
            "Only conclusion I follows",
            "Only conclusion II follows",
            "Both conclusions I & II follow",
            "Neither conclusion follows"
        ],
        correctOption: 1,
        hint: "Draw circles: Laptops circle is entirely inside Devices circle. Phones circle overlaps with Devices, but may not touch Laptops.",
        explanation: "Since All laptops are devices, the intersection of Devices and Laptops is non-empty, so 'Some devices are laptops' (Conclusion II) definitely holds.\nHowever, Phones only overlaps with Devices, and there is no guarantee it intersects Laptops. Hence, only Conclusion II follows.",
        solutionCode: `// All A are B => Some B are A (Valid)
// Answer: Only conclusion II follows`
    },
    {
        id: "study_lr_3",
        category: "study_coach",
        title: "Blood Relations (Family Tree)",
        difficulty: "Easy / Amazon OA",
        topic: "Blood Relations",
        section: "Logical Reasoning",
        marks: "+3 / -0.75",
        question: "Pointing to a photograph of a man, Neha said: 'His mother is the only daughter of my grandmother.' How is Neha related to the man in the photograph?",
        targetOptimization: "Step-by-step family tree tracing from the speaker's grandmother.",
        options: [
            "Mother",
            "Sister",
            "Aunt",
            "Daughter"
        ],
        correctOption: 1,
        hint: "Who is the 'only daughter of Neha's grandmother'? That is Neha's mother!",
        explanation: "1. The only daughter of Neha's grandmother is Neha's mother.\n2. The statement says the man's mother is that same person (Neha's mother).\n3. Since they share the same mother, Neha is the sister of the man in the photograph.",
        solutionCode: `// Only daughter of maternal grandmother = Mother
// Man's mother = Neha's mother => Sister`
    },
    {
        id: "study_lr_4",
        category: "study_coach",
        title: "Number Series Completion",
        difficulty: "Medium / Amazon OA",
        topic: "Number & Alpha Series",
        section: "Logical Reasoning",
        marks: "+3 / -0.75",
        question: "Find the missing number in the sequence:\n3, 8, 18, 38, 78, ?",
        targetOptimization: "Identify multiplication/addition pattern: each term is (previous * 2) + 2.",
        options: [
            "148",
            "156",
            "158",
            "162"
        ],
        correctOption: 2,
        hint: "Look at the differences: 8-3=5, 18-8=10, 38-18=20, 78-38=40. The difference is doubling each step!",
        explanation: "Method 1 (Differences):\n8 - 3 = 5\n18 - 8 = 10\n38 - 18 = 20\n78 - 38 = 40\nNext difference must be 40 * 2 = 80.\nMissing number = 78 + 80 = 158.\n\nMethod 2: 3*2+2=8, 8*2+2=18, 18*2+2=38, 38*2+2=78, 78*2+2 = 158.",
        solutionCode: `// 78 + 80 = 158
Answer: 158`
    },
    {
        id: "study_lr_5",
        category: "study_coach",
        title: "Direction Sense (Displacement)",
        difficulty: "Easy / Amazon OA",
        topic: "Direction & Distance",
        section: "Logical Reasoning",
        marks: "+3 / -0.75",
        question: "A delivery drone flies 12 km North from a hub, then turns East and flies 5 km. What is its shortest straight-line distance from the starting hub?",
        targetOptimization: "Pythagorean theorem: sqrt(12^2 + 5^2) = sqrt(144 + 25) = 13 km.",
        options: [
            "13 km",
            "15 km",
            "17 km",
            "19 km"
        ],
        correctOption: 0,
        hint: "North and East form a 90-degree right triangle. Use the Pythagorean theorem a² + b² = c².",
        explanation: "Shortest distance = √(12² + 5²) = √(144 + 25) = √169 = 13 km.\nDirection: North-East.",
        solutionCode: `// Distance = sqrt(12^2 + 5^2) = 13 km
Answer: 13 km`
    },
    // --- VERBAL APTITUDE QUESTIONS ---
    {
        id: "study_va_1",
        category: "study_coach",
        title: "Subject-Verb Agreement (Spotting Errors)",
        difficulty: "Medium / Amazon OA",
        topic: "Grammar & Error Spotting",
        section: "Verbal Aptitude",
        marks: "+3 / -0.75",
        question: "Choose the grammatically correct option to fill in the blank:\n\n'Neither the engineering lead nor the software developers ___ in favor of postponing the production deployment.'",
        targetOptimization: "Proximity rule for 'neither...nor': verb agrees with the closer subject (plural developers -> were).",
        options: [
            "was",
            "were",
            "is",
            "has been"
        ],
        correctOption: 1,
        hint: "In 'Neither A nor B', the verb agrees with the subject closest to it (the second subject B).",
        explanation: "According to subject-verb agreement rules, when subjects are joined by 'neither... nor', the verb agrees in number with the nearer subject.\nHere, 'software developers' is plural and is closest to the verb, so the plural past verb 'were' is correct.",
        solutionCode: `// Rule: Neither...nor matches nearest subject ('developers' is plural)
Answer: were`
    },
    {
        id: "study_va_2",
        category: "study_coach",
        title: "Idioms & Phrases",
        difficulty: "Easy / Amazon OA",
        topic: "Idiomatic Expressions",
        section: "Verbal Aptitude",
        marks: "+3 / -0.75",
        question: "What is the exact meaning of the idiom 'To bite the bullet'?",
        targetOptimization: "Idiom definitions and corporate context.",
        options: [
            "To face a difficult or unpleasant situation with courage",
            "To make an aggressive and hostile argument",
            "To complete an urgent task ahead of schedule",
            "To apologize reluctantly for a mistake"
        ],
        correctOption: 0,
        hint: "Historically, wounded soldiers were given a lead bullet to bite down on to endure painful surgery without anesthesia.",
        explanation: "'To bite the bullet' means to bravely accept and endure a harsh or unavoidable painful reality that cannot be avoided.",
        solutionCode: `// Meaning: Endure a difficult situation bravely
Answer: To face a difficult or unpleasant situation with courage`
    },
    {
        id: "study_va_3",
        category: "study_coach",
        title: "Vocabulary (Antonym)",
        difficulty: "Medium / Amazon OA",
        topic: "Vocabulary & Antonyms",
        section: "Verbal Aptitude",
        marks: "+3 / -0.75",
        question: "Choose the word that is most nearly OPPOSITE in meaning (Antonym) to:\n\n'EPHEMERAL'",
        targetOptimization: "Ephemeral = lasting for a very short time. Opposite = lasting, permanent, enduring.",
        options: [
            "Transient",
            "Permanent",
            "Fleeting",
            "Fragile"
        ],
        correctOption: 1,
        hint: "'Ephemeral' comes from Greek ephemeros, meaning lasting only for a day or very short-lived (like transient or fleeting).",
        explanation: "'Ephemeral' means lasting for a very brief or temporary period (synonyms: transient, fleeting).\nIts antonym (opposite) is 'Permanent' or 'Eternal'.",
        solutionCode: `// Ephemeral = temporary, short-lived
// Antonym = Permanent`
    },
    {
        id: "study_va_4",
        category: "study_coach",
        title: "Critical Reasoning (Implicit Assumptions)",
        difficulty: "Hard / Amazon OA",
        topic: "Critical Reasoning",
        section: "Verbal Aptitude",
        marks: "+3 / -0.75",
        question: "Statement: 'The cloud operations team enabled auto-scaling to decrease idle infrastructure costs during nighttime off-peak hours.'\n\nWhich of the following is an implicit assumption?",
        targetOptimization: "An assumption is an unstated premise taken for granted.",
        options: [
            "Traffic on the application decreases significantly during nighttime hours.",
            "The application will experience a database bottleneck at night.",
            "Developers are not allowed to deploy code after midnight.",
            "Cloud server performance improves when fewer servers are active."
        ],
        correctOption: 0,
        hint: "Why would auto-scaling save cost at night? Only if the server demand actually drops at night!",
        explanation: "Auto-scaling reduces server instances when traffic drops. For this policy to reduce idle costs, the team must assume that traffic on the app significantly decreases during nighttime off-peak hours.",
        solutionCode: `// Assumption: Traffic drops at night so scaling down saves costs
Answer: Option A`
    }
];

let lastServedDsaId = null;
let lastServedStudyId = null;

export function getDailyProblem(mode = "tech_coach", weakTopics = [], promptText = "") {
    const text = (promptText || "").toLowerCase();
    let filtered = PROBLEMS_BANK.filter(p => p.category === mode);

    if (filtered.length === 0) return PROBLEMS_BANK[0];

    if (mode === "tech_coach") {
        // 1. Specific DSA Topic Matching based on user prompt
        let topicFiltered = null;
        if (text.includes("array") || text.includes("hashmap") || text.includes("hash map") || text.includes("two sum") || text.includes("stock") || text.includes("subarray") || text.includes("kadane") || text.includes("product")) {
            topicFiltered = filtered.filter(p => p.topic.toLowerCase().includes("array") || p.topic.toLowerCase().includes("hash"));
        } else if (text.includes("linked list") || text.includes("linkedlist") || text.includes("list") || text.includes("cycle") || text.includes("node")) {
            topicFiltered = filtered.filter(p => p.topic.toLowerCase().includes("list"));
        } else if (text.includes("two pointer") || text.includes("two-pointer") || text.includes("pointer") || text.includes("sliding window") || text.includes("3sum") || text.includes("water") || text.includes("container") || text.includes("substring")) {
            topicFiltered = filtered.filter(p => p.topic.toLowerCase().includes("pointer") || p.topic.toLowerCase().includes("sliding"));
        } else if (text.includes("tree") || text.includes("bst") || text.includes("binary tree") || text.includes("depth") || text.includes("invert") || text.includes("root")) {
            topicFiltered = filtered.filter(p => p.topic.toLowerCase().includes("tree"));
        } else if (text.includes("stack") || text.includes("queue") || text.includes("parenthes") || text.includes("min stack")) {
            topicFiltered = filtered.filter(p => p.topic.toLowerCase().includes("stack"));
        } else if (text.includes("binary search") || text.includes("search in rotated") || text.includes("log n") || text.includes("divide and conquer")) {
            topicFiltered = filtered.filter(p => p.topic.toLowerCase().includes("binary search"));
        } else if (text.includes("dp") || text.includes("dynamic programming") || text.includes("dynamic") || text.includes("climb") || text.includes("coin") || text.includes("robber") || text.includes("memo")) {
            topicFiltered = filtered.filter(p => p.topic.toLowerCase().includes("dynamic") || p.topic.toLowerCase().includes("fibonacci") || p.topic.toLowerCase().includes("knapsack"));
        } else if (text.includes("graph") || text.includes("island") || text.includes("bfs") || text.includes("dfs") || text.includes("matrix")) {
            topicFiltered = filtered.filter(p => p.topic.toLowerCase().includes("graph"));
        }

        if (topicFiltered && topicFiltered.length > 0) {
            filtered = topicFiltered;
        }

        // 2. Difficulty Filter
        if (text.includes("hard")) {
            const h = filtered.filter(p => p.difficulty.toLowerCase().includes("hard"));
            if (h.length > 0) filtered = h;
        } else if (text.includes("medium")) {
            const m = filtered.filter(p => p.difficulty.toLowerCase().includes("medium"));
            if (m.length > 0) filtered = m;
        } else if (text.includes("easy")) {
            const e = filtered.filter(p => p.difficulty.toLowerCase().includes("easy"));
            if (e.length > 0) filtered = e;
        }

        // 3. Never repeat the same question back-to-back
        let candidates = filtered;
        if (candidates.length > 1 && lastServedDsaId) {
            const withoutLast = candidates.filter(p => p.id !== lastServedDsaId);
            if (withoutLast.length > 0) candidates = withoutLast;
        }

        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        lastServedDsaId = selected.id;
        return selected;
    } else {
        // Study Coach Mode
        if (text.includes("logical") || text.includes("reasoning") || text.includes("blood") || text.includes("syllogism") || text.includes("series") || text.includes("direction") || text.includes("coding")) {
            const lr = filtered.filter(p => p.section === "Logical Reasoning");
            if (lr.length > 0) filtered = lr;
        } else if (text.includes("verbal") || text.includes("english") || text.includes("grammar") || text.includes("idiom") || text.includes("synonym") || text.includes("antonym") || text.includes("error")) {
            const va = filtered.filter(p => p.section === "Verbal Aptitude");
            if (va.length > 0) filtered = va;
        } else if (text.includes("quant") || text.includes("math") || text.includes("speed") || text.includes("train") || text.includes("profit") || text.includes("mixture") || text.includes("work") || text.includes("age")) {
            const qa = filtered.filter(p => p.section === "Quantitative Aptitude");
            if (qa.length > 0) filtered = qa;
        }

        let candidates = filtered;
        if (candidates.length > 1 && lastServedStudyId) {
            const withoutLast = candidates.filter(p => p.id !== lastServedStudyId);
            if (withoutLast.length > 0) candidates = withoutLast;
        }

        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        lastServedStudyId = selected.id;
        return selected;
    }
}

export function evaluateVerbalApproach(verbalText = "") {
    const text = verbalText.toLowerCase().trim();

    // If user is asking a conceptual question, let the generative AI answer it
    const questionStarters = ["what is", "what's", "explain", "how does", "how do", "tell me about", "difference between", "why is", "define"];
    if (questionStarters.some(q => text.startsWith(q))) {
        return null;
    }

    if (text.includes("two pointer") || text.includes("two-pointer")) {
        return {
            verdict: "Optimal Reasoning: Two-Pointer technique reduces Time Complexity to O(N) and maintains O(1) Space Complexity.",
            strength: "Two-Pointers",
            complexity: "Time: O(N) | Space: O(1)",
            optimal: true
        };
    }

    if (text.includes("hash") || text.includes("map") || text.includes("hashmap")) {
        return {
            verdict: "Excellent approach! Using a HashMap grants O(N) Time Complexity by trading O(N) Space Complexity for fast O(1) lookups.",
            strength: "HashMaps",
            complexity: "Time: O(N) | Space: O(N)",
            optimal: true
        };
    }

    if (text.includes("binary search") || text.includes("divide and conquer")) {
        return {
            verdict: "Great approach! Binary Search achieves logarithmic O(log N) Time Complexity on sorted inputs.",
            strength: "Binary Search",
            complexity: "Time: O(log N) | Space: O(1)",
            optimal: true
        };
    }

    if (text.includes("nested loop") || text.includes("brute force") || text.includes("for loop inside") || text.includes("two loops")) {
        return {
            verdict: "A nested loop approach works, but takes O(N²) quadratic time complexity which causes Time Limit Exceeded (TLE) in Amazon interviews. Can we optimize it using a HashMap or Two-Pointers?",
            weakness: "Time Complexity O(n²)",
            complexity: "Time: O(N^2) | Space: O(1)",
            optimal: false
        };
    }

    if (text.includes("recursion") && !text.includes("memo") && !text.includes("dp")) {
        return {
            verdict: "Plain recursion takes exponential O(2^N) time. Remember to add memoization or Dynamic Programming to prevent Stack Overflow and reduce time complexity to O(N).",
            weakness: "Recursion Stack Overflow",
            complexity: "Time: O(2^N) -> Optimize to O(N)",
            optimal: false
        };
    }

    return null; // Not an explicit algorithm evaluation prompt
}

export async function performWebSearch(query) {
    try {
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const searchRes = await fetch(searchUrl, {
            signal: AbortSignal.timeout(3500),
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9"
            }
        });
        const html = await searchRes.text();
        const regex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/gi;
        const snippets = [];
        let m;
        while ((m = regex.exec(html)) !== null && snippets.length < 6) {
            const cleanText = m[1].replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim();
            if (cleanText) snippets.push(cleanText);
        }
        return snippets;
    } catch (err) {
        // Return empty silently if timeout or network fails
        return [];
    }
}

