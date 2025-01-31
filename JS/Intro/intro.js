function fibonacciGenerator(n) {
  let numbers = [];
  for (let i = 0; i < n; i++) {
    if (i == 0) {
      numbers.push(0);
    } else if (i <= 1) {
      numbers.push(1);
    } else {
      let nextNumber = numbers[i - 1] + numbers[i - 2];
      numbers.push(nextNumber);
    }
  }
  return numbers;
}
