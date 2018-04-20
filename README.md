# Brackets-SmartComment
Generates JS Doc comment helps with the hinting of types and tags inside comment

## Generate doc comment for js functions, classes, constants, property etc
1) Start typing /**
2) You will get a hint /** */
3) Insert this hint (this will generate doc comment)

This will generate something like this depending on next node (function, class etc)
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
2) Press tab ( this will select next item wrapped in square brackets i.e. [[Description]]

## Hints inside comment
1) You can get hints for types just remove type and press ctrl+space
2) Tag hints, tag hints will pop up on pressing @
3) You can also see the purpose of the selected tag

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
* Set Cursor at more useful position

## TODO Items
* Check comment on the fly and give errors to the user in real-time
* Help user In generating Docs for his project
* Better Hint Experience And Help more in editing generated comment

