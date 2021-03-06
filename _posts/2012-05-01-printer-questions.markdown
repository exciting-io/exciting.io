---
layout: post
title:  Printer Questions
date:   2012-05-01 00:05:00
tags: printer
---

The response to our open source printer project has been amazing, but some people rightly have questions, so I'll try to answer them here.

If you've got a question about [Printer], or want to discuss your ideas for printer, why not [check the FAQ on the wiki][FAQ], [ask on the mailing list][mailing list], or [follow the printer project on Twitter][twitter]?

<!-- more -->

## Q: ![I want to get my hands on one of these...](/images/printer-questions/get-one.jpg)

**A:** That's great Rory, and we'd really love for as many people as possible to start exploring with us. For me, one of the main aims of this project is to get other people to build some great [content services][] that we can all take advantage of.

The fastest way of getting your hands on one right now is building one yourself. There are [some hopefully comprehensive instructions][making] on the github wiki, which should be easy for anyone to follow.


## Q: ![Why is this different to little printer or the adafruit iot printer](/images/printer-questions/different-to-lp.jpg)

**A:** This is a great question, which for various reasons I've avoided answering, but may as well address it now.

The [Adafruit IoT printer][adafruit printer] consists of the same printer unit that we're using, with a nice enclosure and some simple Arduino software for printing tweets. If you want to use the printer to print something else, you will need to write new software for the Arduino to do so. If you want to print something other than ASCII text, you'll have quite a bit of work do to too[^adafruit-graphics].

Our [printer platform][Printer] system, on the other hand, separates the content from the printer entirely, and makes it very simple to send rich content for printing from a variety of services.

However, it's fairly simple to configure the Adafruit IoT printer to work with the [Printer]. You'll need to add an SD card, and modify the sketch slightly since the Adafruit kit doesn't have the same LEDs or switch, but those are relatively trivial changes to make.

[Little Printer][LP] is going to be a lovely, polished piece of hardware, with some very polished and intuitive software that works with it. I want one. However, it's not clear to what extent you will be able to use that hardware outside of the experiences that BERG and their partners have built[^lp-api].

I think the best way to characterise it is as follows: if you just want a simple printer in your living room, with as little fuss as possible, you probably want the consumer experience that Little Printer will hopefully deliver. If you're interested in tinkering and exploring what (potentially esoteric) things might be interesting to print, then you might be interested in using what we've built.

There's no reason why you can't use both. I probably will. I don't see our project as being competitive with Little Printer. Instead, I think it's a nice open-source complement which some people might find interesting, and they can use [our system](printer) to get started exploring small printers *now*.

[^adafruit-graphics]: Although it's not simple to use the Ardunio directly to print graphical content, as part of my early work on the [Printer] system I contributed some code to the [Arduino Library](https://github.com/adafruit/Adafruit-Thermal-Printer-Library) which does make this simpler.

[^lp-api]: BERG haven't made any specific information available (beyond [hints](https://twitter.com/bergcloud/status/195450384515465216)) about what kind of user-accessible API that Little Printer may have. I have a few ideas about what they *might* do, but you'd really need to ask them. It's quite possible that what they are building will allow similar flexibility


## Q: ![THIS IS AMAZING](/images/printer-questions/amazing.jpg)

**A:** Gosh. Thanks Tim! And thanks also for including us in your [Wired Design article](http://www.wired.com/design/2012/04/iny-printer-trend/), which also gives a good overview of some other really interesting printer projects.


## Q: ![Super cool idea! But will this library work with Raspberry Pi?](/images/printer-questions/raspberry-pi.jpg)

**A:** Well, Xander, there's no reason why the [Raspberry PI][] couldn't be set up to work with Printer. It would, I imagine, fill the same role as the Arduino, whose only job is to poll a URL for data, and then send any received data over a serial port.

I would expect it to be much easier to write the software to run on the Raspberry PI, because you'll be able to program it in a high-level language like Ruby or Python.


## Q: ![Surely this relies on a proprietary printer and doesn't work with ALL thermal printers?](/images/printer-questions/different-printer.jpg) ![Hey, do you know if the EPSON TMT-88IV is supported?](/images/printer-questions/epson-printer.jpg)

**A:** The printer-specific parts of the system are isolated inside [PrintProcessor](https://github.com/exciting-io/printer/tree/master/lib/print_processor) classes. These take abstract image data which the system produces (essentially an array of pixels), and should emit data suitable for a printer.

When the Arduino (or Raspberry PI, or anything else) polls the server for data, it does so with an _Accept_ header that is used to tell the server what kind of printer is being targetted. The default is _A2-raw_,  corresponding to the _A2Raw_ print processor, which translates the pixels into the raw serial bytes that the printer will understand.

If you want to use a different kind of printer, you'll need to do two things:

1. Define a new 'type' and change your Arduino to send that in the _Accept_ header (e.g. <tt>Accept: application/vnd.exciting.printer.TMT-88IV</tt>)
2. Add a class that maps the image data into the specific commands for that printer (see [A2Raw](https://github.com/exciting-io/printer/blob/master/lib/print_processor/a2_raw.rb) for an example)

I'm hoping to get a chance to make the documentation around this more comprehensive, but there are already [quite a few things][issues] to investigate. If you're interesting in tackling this yourself, [get in touch on the mailing list][mailing list] and we'll do our best to help you out.

## Q: ![I wonder how I make it a bit darker?](/images/printer-questions/darker.jpg)

**A:** I'd like to add some configuration via the server to control the darkness of printing, but for the moment you can control this by  modifying [the type in the Arduino sketch][printer-type] to something like <tt>A2-raw.240</tt>.

You can tweak this value to suit your printer. What I've found is that the darker you make it the more likely it is that the paper will stick to the print head.

![A2-raw.240](/images/printer-questions/darker-solution.jpg)

Exactly. Bravo, Andy!

## Q: ![This seems to be upside down; How about that](/images/printer-questions/upside-down.jpg)

**A:** If you're using the default printer type, you can flip it by editing the Arduino sketch and [setting the type][printer-type] to <tt>A2-raw.240.flipped</tt>. Again, I'd like make this a bit more elegant, but for the moment this works.


## Q: ![I like the idea of printer output I can stuff into my wallet or post onto a surface. Cool that it is ephemeral In that the Images fade over time. I may get one to play with if Its price is < $100](/images/printer-questions/price.jpg)

**A:** I've spent some time investigating costs for doing this, and you can see a fairly detailed breakdown in [the component list on the wiki][components]. As that page concludes, there's a fairly hard lower bound to the component cost, even buying in bulk, and it looks like the raw cost is around $140 or £80. That's without any margin at all, and doesn't include postage or any local taxes (like VAT here in the UK).

I'd love to be able to sell everybody a printer for as little as possible, but realistically that would mean building our own controller boards, rather than using Arduinos. This would be very expensive for us to develop (as I'm sure BERG will have experienced), and also makes the final hardware less hackable for you.

We're still keen to help as many people explore printing as possible, and so we'll keep looking at how we might do this. We still have a small number of kits available to loan if you are based near us (London), and there is a chance that there will be a very small number of kits available to sell in the near future.

Watch [this blog](/blog), the [mailing list][] and the [gfrprinter twitter account][twitter] for updates.

## More questions?

We'd love to hear from you. Sign up to the [mailing list], or [follow the printer project on Twitter][twitter] to ask us any other questions, or discuss your ideas for printing with other people.


[making]: https://github.com/exciting-io/printer/wiki/Making-your-own-printer
[content services]: https://github.com/exciting-io/printer/wiki/Building-content-services
[Raspberry PI]: http://www.raspberrypi.org/
[twitter]: http://twitter.com/gfrprinter
[components]: https://github.com/exciting-io/printer/wiki/Component-list
[printer-type]: https://github.com/exciting-io/printer/blob/master/printer.ino#L23
[adafruit printer]: https://www.adafruit.com/products/717
[printer]: http://exciting.io/printer
[issues]: https://github.com/exciting-io/printer/issues
[mailing list]: http://groups.google.com/group/gfr-printer
[LP]: http://bergcloud.com/littleprinter
[FAQ]: https://github.com/exciting-io/printer/wiki/Frequently-Asked-Questions
