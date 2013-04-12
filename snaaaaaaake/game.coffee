
KEYCODES =
    13: "return"
    37: "left"
    38: "up"
    39: "right"
    40: "down"

GAME_WIDTH = 512
GAME_HEIGHT = 512

log = -> return
# log = console.log


Graphics =
    #Encapsulates all of that canvas context mucking about

    init: ->
        @canvas = document.getElementById("gamecanvas")
        @canvas.width = GAME_WIDTH
        @canvas.height = GAME_HEIGHT
        @ctx = @canvas.getContext("2d")
        @rect()

    isCanvasSupported: ->
        elem = document.createElement('canvas')
        return !!(elem.getContext && elem.getContext('2d'))

    rect: (color="#000000", x=0, y=0, w=GAME_WIDTH, h=GAME_HEIGHT) ->
        @ctx.beginPath()
        @ctx.rect(x, y, w, h)
        @ctx.closePath()
        @ctx.fillStyle = color
        @ctx.fill()

    drawSegment: (x, y) ->
        @rect("#33ff33", x*16+1, y*16+1, 14, 14)

    drawHead: (x, y) ->
        @rect("#99ff33", x*16+1, y*16+1, 14, 14)

    drawFood: (x, y) ->
        @rect("#33ffff", x*16+2, y*16+2, 12, 12)

    writeText: (text, x, y) ->
        @ctx.fillStyle = "#ffffff"
        @ctx.beginPath()
        @ctx.fillText(text, x, y)
        @ctx.closePath()


class Segment
    #Any particular bit of a snake

    constructor: (@x, @y) ->

    draw: (head) ->
        if head
            Graphics.drawHead(@x, @y)
        else
            Graphics.drawSegment(@x, @y)

    overlaps: (food) ->
        return (@x==food.x and @y==food.y)

    outOfBounds: ->
        @x < 0 or @x >= 32 or @y < 0 or @y >= 32

    recycle: (@x, @y) ->


class Food
    #The object that the player is after

    constructor: (@x, @y) ->

    draw: ->
        Graphics.drawFood(@x, @y)


class Game
    #Handles all game logic and doodling

    constructor: ->
        @snake = []
        for y in [0..2]
            @snake.push(new Segment(16, 16+y))
        @mode = "play"
        @food = new Food(16, 16)
        @dir = "up"
        @next_dir = null
        @growth = 0
        @score = 0
        @recycle_bin = []
        @placeFood()

    changeDir: (d) ->
        # possible bug here, next_dir could be set to something that's not UDLR.
        @next_dir = d

    verifiedChangeDir: (old, next=old) ->
        switch old
            when "left"
                if next != "right" then next else old
            when "up"
                if next != "down" then next else old
            when "right"
                if next != "left" then next else old
            when "down"
                if next != "up" then next else old
            else
                old

    createSegment: (x, y) ->
        # Avoid having to create and gc segments all the time
        segment = null
        if @recycle_bin.length > 0
            segment = @recycle_bin.pop()
            segment.recycle(x, y)
            while @recycle_bin.length > 2
                @recycle_bin.pop()
        else
            log("Creating new segment")
            segment = new Segment(x, y)
        return segment

    placeFood: ->
        ox = Math.floor(Math.random()*32)
        oy = Math.floor(Math.random()*32)
        @food.x = ox
        @food.y = oy
        while true
            overlaps = 0
            for segment in @snake
                if segment.overlaps(@food)
                    overlaps = true
                    break
            if not overlaps
                return
            @food.x += 1
            if @food.x >= 32
                @food.x = 0
                @food.y = (@food.y + 1) % 32
            if (@food.x == ox) and (@food.y == oy)
                @gameover(3)
                return

    tick: ->
        if @mode == "play"
            @update()
        @draw()

    draw: ->
        first = true
        Graphics.rect()
        for segment in @snake
            segment.draw(first)
            first = false
        @food.draw()
        if @mode == "gameover"
            Graphics.writeText("GAMEOVER", 32, 32)
            Graphics.writeText("FINAL SCORE: "+@score, 32, 48)
            Graphics.writeText("PRESS ENTER TO RESTART", 32, 64)

    update: ->
        old_head = @snake[0]
        x = old_head.x
        y = old_head.y

        @dir = @verifiedChangeDir(@dir, @next_dir)
        @next_dir = null

        switch @dir
            when "left" then x -= 1
            when "up" then y -= 1
            when "right" then x += 1
            when "down" then y += 1

        head = @createSegment(x, y)
        head = new Segment(x, y)

        for segment in @snake
            if head.overlaps(segment)
                @gameover(1)
                return

        if head.outOfBounds()
            @gameover(2)
            return

        @snake.unshift(head)
        if head.overlaps(@food)
            @score++
            @placeFood()
            @growth = 3

        if @growth <= 0
            @recycle_bin.push(@snake.pop())
        else
            @growth -= 1

    gameover: (id=0) ->
        log("gameover"+id)
        @mode = "gameover"


window.onload = ->
    #Sets up the gamewindow, timer, and handles initial keypresses

    if !Graphics.isCanvasSupported() then return

    tickId = null
    game = null

    newGame = ->
        game = new Game
        if tickId then window.clearInterval(tickId)
        tickId = window.setInterval(game.tick.bind(game), 125)

    listener = (evt) ->
        if evt.keyCode of KEYCODES
            if KEYCODES[evt.keyCode] == "return"
                newGame()
            else
                game.changeDir(KEYCODES[evt.keyCode])

    Graphics.init()
    newGame()
    window.addEventListener('keydown', listener, true)

