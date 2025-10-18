def compute(values):
    s = 0
    c = 0
    for v in values:
        if v > 0:
            s += v
            c += 1
    return s / c if c else 0

if __name__ == '__main__':
    print(compute([1,2,-3,4]))