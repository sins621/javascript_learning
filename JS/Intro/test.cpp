#include <iostream>

using namespace std;

unsigned long long fibonacci(unsigned long long n) {
  if (n <= 1) {
    return n; // base cases
  }
  return fibonacci(n - 1) + fibonacci(n - 2); // recursion
}

int main() {
  cout << fibonacci(50) << endl; // 832040
  return 0;
}
