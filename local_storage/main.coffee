
log = console.log

class Main
    constructor: ->
        $("button#new_value").bind("click", this.onNew)
        $("button#save_value").bind("click", this.onSave)
        $("button#del_value").bind("click", this.onDelete)
        @refreshKeys()
        @updateKeyValueDisplay(null)

    updateKeyValueDisplay: (key)->
        value = ""

        if key isnt null
            try
                value = window.localStorage[key]
            catch e
                log(e)
        else
            key = ""

        $("input#key_name").val(key)
        $("textarea#value_display").val(value)

    refreshKeys: ->
        $tablecell = $("td#keys_list")
        $tablecell.html("<ul></ul>")
        $list = $tablecell.find("ul")

        for key of window.localStorage
            $a = $("<a id='localkey_"+key+"' href='#'>"+key+"</a>")
            $a.bind("click", @onKeyLink)
            $li = $("<li>")
            $li.append($a)
            $list.append($li)

    onNew: (event) =>
        @updateKeyValueDisplay(null)

    onSave: (event) =>
        key = $("input#key_name").val()
        value = $("textarea#value_display").val()
        window.localStorage[key]=value
        @refreshKeys()

    onDelete: (event) =>
        key = $("input#key_name").val()
        if key of window.localStorage
            delete window.localStorage[key]
        @updateKeyValueDisplay(null)
        @refreshKeys()

    onKeyLink: (event) =>
        $a = $(event.target)
        id = $a.attr("id")
        @updateKeyValueDisplay(id.slice(id.indexOf('_')+1))


main = null
$(window).on "load", ->
    main = new Main

