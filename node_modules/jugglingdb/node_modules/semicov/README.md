Test coverage tool. It can generate nifty html report.

## Installation

    npm install semicov

## It works only...

...only if your code has semicolons. And it will break badly-written javascript:

```javascript
if (condition) doSomething();
else doSomethingElse();
```

So, basically it should work very well for any code passed following [jslint](http://www.jslint.com) validations:

- [semicolons](http://www.jslint.com/lint.html#semicolon)
- [required blocks](http://www.jslint.com/lint.html#required)

## Usage

Put following line before very first line of your code

    require('semicov').init('lib'); // 'lib' is name of dir with code

Optionally put this code somewhere

    process.on('exit', require('semicov').report);

And it will generate `./coverage.html` for you.

