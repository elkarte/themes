## Introduction
You finished your theme and now want to add it to the [Theme Site](http://themes.elkarte.net), awesome!  
  
To do so you need to make a PR to the elkarte/themes repo to the gh-pages branch.  The how to fork a repo, make a local copy, apply your changes, and submit the PR are not part of this guide. There are many guides on how to do this and it all depends on what tools you have chosen. This help assumes you know how to make a PR.
  
To add your theme to the listing, you need to commit just a single file under the _posts directory. The file must follow the naming convention of YYYY-MM-DD-Theme Name.  The date should be the initial release date of your theme, that date is only used to create the permalink to the file.  
  
The above file must contain the following sections (see any of the existing files in the _posts directory for examples)  
```
---  
front matter  
---  
  
detailed description  
``` 

### Front Matter
The front matter is what makes everything cool happen. The front matter must be the first thing in the file and must take the form of valid YAML set between triple-dashed lines. Meaning the information contained between the --- & --- tags is in YAML format and is specially processed by Jekyll.   

What the frig is YAML?, I don't want to learn YAML!, Good neither did I and you don't have either, just follow along.  
  
### Example file with front matter
```
---  
layout: post  
title: "Title of your theme"  
category: a category name  
color: dark
date: YYYY-MM-DD  
comments: false  
short: "A short description of your theme"  
license: license  
version: x.x.x  
elkversion: 1.0  
support: valid link or null  
demo: valid link or null  
author: thats you!  
thumbnail: valid link or null  
download: valid link  
images:  
  -Some name: link to it  
  -Another name: link to it  
---  
  
Markdown text  
  
## Installation:  
{% include install_std.MD %}  
  
## License:  
{% include license.MD param="BSD"%}  
```
### Front Matter Details
* layout: post  
	* The name following layout is a template file to use when the page is rendered. Currently there is only one choice and that is post. Others may be added at some point.
* title: "Title of your theme"  
	* The name of the theme. This is used in the template titles and listings.
* category: name  
	* This categorises the type of the theme, used to help group similar items for navigation. Currently this must be one of the following.
	* dark, minimal, variant, mimic, creative, professional, other
* color: color
    * Generally used to indicate the color scheme such as light or dark.
* date: YYYY-MM-DD  
	* 2014-12-20 for example. This date is used to determine the order themes are shown. If you make an important update, just change that date and it will float to the top.
* comments: false  
	* Not currently enabled, but at some point discus comments may be enabled.
* short: "A short description of the theme"  
	* This is your short description of the theme, be creative and embellish. It will appear in the main listing to provide a short description of the what the theme is all about, or at least what you think it all about :D
* license: license  
	* Type of license you are releasing the work under, this is completely your choice. Typical values here are CC BY 4.0, CC BY ND 4.0, CC BY NC ND 4.0, BSD, etc. If its a common open source license the OSI or Free Cultural Works logo will appear next to it in the listing.
* version: x.x.x  
	* Current version of the theme, use what you like, 1.0.0 or V1 Beta 4, 1.0, etc. 
* elkversion: 1.0  
	* If a specific minimum version of ElkArte is needed to run the theme, set it here, like 1.0.2
* support: valid link or empty  
	* If you have a support thread at ElkArte, or elsewhere, link to it. This will set the Support button on the theme page. Discard it or leave it blank if you have no support options.
* demo: valid link or empty  
	* If you have an demo page for the theme, add the link here. A link here sets the Demo button in the template
* author: Thats you  
	* Do I really have to explain this field, if so how did you get here?
* thumbnail: valid link or empty  
	* This is the url to an image that is seen as a thumbnail on the main listing page.
	* It does not have to be thumbnailed sized, the css of the page takes care of that for you.
	* The link can be to any valid location, including Github repos (use raw). You may also choose to save your images directly in the addons repo, for this add them under the assets folder in their own sub folder. Then simply use a relative link such as ```/assets/theme_folder_name/imagename.xyz```
* download: valid link  
	* Where to get the theme, this can be any valid link. You can choose to link to a Github release, master.zip or link to a support thread with information on where to get it.  You can even add it to the ElkArte themes repo under a ```/assets/theme_folder_name/theme_name.zip``` A link here sets the Download button in the templates.
* images: ...  
	* This needs to be in a YAML (there is that word again) array format, which simply means images: followed by a new line, then space space dash space item: link (repeat)
	* Again the format of each image line is ```image: space space dash space some name: link```. Some name is used as the alt tag value in the template, the link is the location of the image
	* Images are shown below your detailed theme description, it should be the screen shots of what the theme looks like in various areas.
	* The location follows the same rules as the thumbnail, so if wanted you can add your images to the assets folder and use relative location links you can.
* Markdown Text  
	* This is the detailed body describing your theme. Valid markdown, plain text or even html can be used, the choice is yours, although markdown text is the preferred method.
	* This is the text that appears on the themes details page.
  
Two helper templates are provided, one is the generic theme installation instructions and the other is the license block. To use the installation template add  
```
## Installation:  
{% include install_std.MD %}  
```

For the license template use the following with a param of
* CC BY 4.0, CC BY ND 4.0, CC BY NC ND 4.0, CC BY SA 4.0, CC BY NC SA 4.0, CC BY NC 4.0, BSD, BSD 2, BSD 3

If you use a different license add your own block or make a PR to have it added to license.MD in the _includes directory
```
### License:  
{% include license.MD param="CC BY 4.0"%} 
```
