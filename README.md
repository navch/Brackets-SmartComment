# Brackets-SmartComment
Generates JS Doc comment, helps with hinting of type inside comment

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
2) Press tab ( this will slect next item wrapped in square brackets i.e. [[Description]]

## Hints inside comment
1) You can get hints for types just delete type and press ctrl+space
2) Tag hints, tag hints will pop up on pressing @
3) For all tags you can also see purpose of selected tag

Screenshot of hints

## Delete Generated Doc
1) If generated doc comment is not useful then Press Ctrl+Alt+A
2) Now whoile comment is selected, Now you delete that
3) Still you will be able to use tag and typpe hints

Gif for complete workflow


# Known Issues
* Indentation issue in generated Comment
* Set Cursor position at more useful position
* Minor Issues in Hint UI 

# TODO Items
* Check comment on the fly and provide errors to user in real time
* Help user In generating Docs for his project
* Better Hint Experince And Help more in editing generated comment

