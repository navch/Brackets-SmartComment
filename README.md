# Brackets-SmartComment
Generates JS Doc comment helps with the hinting of types and tags inside comment

## Generate doc comment for js functions, classes, constants, property etc
1) Start typing /**
2) One hint will pop-up
3) Insert hint (this will generate doc comment)

### example Generating comment for function
In case of function this is taking care of parameters name, number of parameters, return statement etc
```
/**
 *
 * @param {[[type]]} template [[Description]]
 * @param {[[type]]} params [[Description]]
 * @param {[[type]]} isReturnSt [[Description]]
 * @return {[[type]]} [[Description]]
 */
 ```

## Navigate inside comment
1) Bring your cursor inside comment
2) Press tab (It will select next item wrapped in square brackets i.e. [[Description]])
* Inspired by https://github.com/wikunia/brackets-funcdocr
* This is a great extension which documents functions and supports multiple languages
Note:- Together these extensions may behave wrong
According to me, For Js language you can use this extension for others FuncDocr is the right choice

## Hints inside comment
1) Select type by pressing tab, remove it and press ctr+space
2) Tag hints, tag hints will pop up on pressing @
3) The description is also available on selecting a tag

### Hints
![Hints](https://github.com/navch/Brackets-SmartComment/blob/master/screenshots/taghints.png)

## Delete Generated Doc
1) If generated doc comment is not useful then Press Ctrl+Alt+A
2) It will select the whole comment, Now you remove that
3) Still, you will be able to use the tag and type hints

### Workflow
![Workflow](https://github.com/navch/Brackets-SmartComment/blob/master/screenshots/bracketsjsdocsdemo.gif)


## Known Issues
* Indentation issue in generated Comment

## TODO Items
* Check comment on the fly and give errors to the user in real-time
* Help user In generating Docs for his project
* Better Hint Experience And Help more in editing generated comment

