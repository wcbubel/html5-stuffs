
#In languages like js/cs, singletons are kinda pointless,
#as any object created through {} and stored globally is valid.
#But, sometimes the create-on-demand behavior of singleton
#is useful. This is a class that can be extended that adds that
#behavior. Cleaned up from something I found on stackoverflow.
class Singleton
    @_instance: null
    @instance: ->
        @_instance or= new @(arguments...)


#This is the generally accepted way to check for 2d canvas support
isCanvasSupported: ->
    elem = document.createElement('canvas')
    return !!(elem.getContext && elem.getContext('2d'))

