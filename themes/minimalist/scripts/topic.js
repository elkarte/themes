/**
 * @name      ElkArte Forum
 * @copyright ElkArte Forum contributors
 * @license   BSD http://opensource.org/licenses/BSD-3-Clause
 *
 * This software is a derived product, based on:
 *
 * Simple Machines Forum (SMF)
 * copyright:	2011 Simple Machines (http://www.simplemachines.org)
 * license:  	BSD, See included LICENSE.TXT for terms and conditions.
 *
 * @version 1.0 Alpha
 *
 * This file contains javascript associated with the topic viewing including
 * Quick Modify, Quick Reply, In Topic Moderation, thumbnail expansion etc
 */

// *** QuickModifyTopic object.
function QuickModifyTopic(oOptions)
{
	this.opt = oOptions;
	this.aHidePrefixes = this.opt.aHidePrefixes;
	this.iCurTopicId = 0;
	this.sCurMessageId = '';
	this.sBuffSubject = '';
	this.oCurSubjectDiv = null;
	this.oTopicModHandle = document;
	this.bInEditMode = false;
	this.bMouseOnDiv = false;
	this.bXmlHttpCapable = this.isXmlHttpCapable();
	this.init();
}

// @todo Determine if this is even needed anymore opera meh
// Ajax supported?
QuickModifyTopic.prototype.isXmlHttpCapable = function ()
{
	if (typeof(window.XMLHttpRequest) == 'undefined')
		return false;

	// Opera didn't always support POST requests. So test it first.
	if ('opera' in window)
	{
		var oTest = new XMLHttpRequest();
		if (!('setRequestHeader' in oTest))
			return false;
	}

	return true;
}

// Used to initialise the object event handlers
QuickModifyTopic.prototype.init = function ()
{
	// Attach some events to it so we can respond to actions
	this.oTopicModHandle.instanceRef = this;

	// detect and act on keypress
	this.oTopicModHandle.onkeydown = function (oEvent) {return this.instanceRef.modify_topic_keypress(oEvent);};

	// Used to detect when we've stopped editing.
	this.oTopicModHandle.onclick = function (oEvent) {return this.instanceRef.modify_topic_click(oEvent);};
}

// called from the double click in the div
QuickModifyTopic.prototype.modify_topic = function (topic_id, first_msg_id)
{
	// Add backwards compatibility with old themes.
	if (typeof(cur_session_var) == 'undefined')
		cur_session_var = 'sesc';

	// already editing
	if (this.bInEditMode)
	{
		// same message then just return, otherwise drop out of this edit.
		if (this.iCurTopicId == topic_id)
			return;
		else
			this.modify_topic_cancel();
	}

	this.bInEditMode = true;
	this.bMouseOnDiv = true;
	this.iCurTopicId = topic_id;

	// Get the topics current subject
	ajax_indicator(true);
	sendXMLDocument.call(this, smf_prepareScriptUrl(smf_scripturl) + "action=quotefast;quote=" + first_msg_id + ";modify;xml", '', this.onDocReceived_modify_topic);
}

// callback function from the modify_topic ajax call
QuickModifyTopic.prototype.onDocReceived_modify_topic = function (XMLDoc)
{
	// If it is not valid then clean up
	if (!XMLDoc || !XMLDoc.getElementsByTagName('message'))
	{
		this.modify_topic_cancel();
		return true;
	}

	this.sCurMessageId = XMLDoc.getElementsByTagName("message")[0].getAttribute("id");
	this.oCurSubjectDiv = document.getElementById('msg_' + this.sCurMessageId.substr(4));
	this.sBuffSubject = getInnerHTML(this.oCurSubjectDiv);

	// Here we hide any other things they want hidden on edit.
	this.set_hidden_topic_areas('none');

	// Show we are in edit mode and allow the edit
	ajax_indicator(false);
	this.modify_topic_show_edit(XMLDoc.getElementsByTagName("subject")[0].childNodes[0].nodeValue);
}

// Cancel out of an edit and return things to back to what they were
QuickModifyTopic.prototype.modify_topic_cancel = function ()
{
	setInnerHTML(this.oCurSubjectDiv, this.sBuffSubject);
	this.set_hidden_topic_areas('');
	this.bInEditMode = false;

	return false;
}

// Simply restore/show any hidden bits during topic editing.
QuickModifyTopic.prototype.set_hidden_topic_areas = function (set_style)
{
	for (var i = 0; i < this.aHidePrefixes.length; i++)
	{
		if (document.getElementById(this.aHidePrefixes[i] + this.sCurMessageId.substr(4)) != null)
			document.getElementById(this.aHidePrefixes[i] + this.sCurMessageId.substr(4)).style.display = set_style;
	}
}

// For templating, shown that an inline edit is being made.
QuickModifyTopic.prototype.modify_topic_show_edit = function (subject)
{
	// Just template the subject.
	setInnerHTML(this.oCurSubjectDiv, '<input type="text" name="subject" value="' + subject + '" size="60" style="width: 95%;" maxlength="80" class="input_text" /><input type="hidden" name="topic" value="' + this.iCurTopicId + '" /><input type="hidden" name="msg" value="' + this.sCurMessageId.substr(4) + '" />');

	// attach mouse over and out events to this new div
	this.oCurSubjectDiv.instanceRef = this;
	this.oCurSubjectDiv.onmouseout = function (oEvent) {return this.instanceRef.modify_topic_mouseout(oEvent);};
	this.oCurSubjectDiv.onmouseover = function (oEvent) {return this.instanceRef.modify_topic_mouseover(oEvent);};
}

// Yup thats right, save it
QuickModifyTopic.prototype.modify_topic_save = function (cur_session_id, cur_session_var)
{
	if (!this.bInEditMode)
		return true;

	// Add backwards compatibility with old themes.
	if (typeof(cur_session_var) == 'undefined')
		cur_session_var = 'sesc';

	var i, x = new Array();
	x[x.length] = 'subject=' + document.forms.quickModForm['subject'].value.replace(/&#/g, "&#38;#").php_to8bit().php_urlencode();
	x[x.length] = 'topic=' + parseInt(document.forms.quickModForm.elements['topic'].value);
	x[x.length] = 'msg=' + parseInt(document.forms.quickModForm.elements['msg'].value);

	// send in the call to save the updated topic subject
	ajax_indicator(true);
	sendXMLDocument.call(this, smf_prepareScriptUrl(smf_scripturl) + "action=jsmodify;topic=" + parseInt(document.forms.quickModForm.elements['topic'].value) + ";" + cur_session_var + "=" + cur_session_id + ";xml", x.join("&"), this.modify_topic_done);

	return false;
}

// done with the edit, if all went well show the new topic title
QuickModifyTopic.prototype.modify_topic_done = function (XMLDoc)
{
	ajax_indicator(false);

	// If it is not valid then clean up
	if (!XMLDoc || !XMLDoc.getElementsByTagName('subject'))
	{
		this.modify_topic_cancel();
		return true;
	}

	var message = XMLDoc.getElementsByTagName("smf")[0].getElementsByTagName("message")[0];
	var subject = message.getElementsByTagName("subject")[0];
	var error = message.getElementsByTagName("error")[0];

	// No subject or other error?

	if (!subject || error)
		return false;

	this.modify_topic_hide_edit(subject.childNodes[0].nodeValue);
	this.set_hidden_topic_areas('');
	this.bInEditMode = false;

	// redo tips if they are on since we just pulled the rug out on this one
	if ($.isFunction($.fn.SiteTooltip));
		$('.preview').SiteTooltip().smf_tooltip_off;

	return false;
}

// Done with the edit, put in new subject and link.
QuickModifyTopic.prototype.modify_topic_hide_edit = function (subject)
{
	// Re-template the subject!
	setInnerHTML(this.oCurSubjectDiv, '<a href="' + smf_scripturl + '?topic=' + this.iCurTopicId + '.0">' + subject + '<' +'/a>');
}

// keypress event ... like enter or escape
QuickModifyTopic.prototype.modify_topic_keypress = function (oEvent)
{
	if (typeof(oEvent.keyCode) != "undefined" && this.bInEditMode)
	{
		if (oEvent.keyCode == 27)
		{
			this.modify_topic_cancel();
			if (typeof(oEvent.preventDefault) == "undefined")
				oEvent.returnValue = false;
			else
				oEvent.preventDefault();
		}
		else if (oEvent.keyCode == 13)
		{
			this.modify_topic_save(smf_session_id, smf_session_var);
			if (typeof(oEvent.preventDefault) == "undefined")
				oEvent.returnValue = false;
			else
				oEvent.preventDefault();
		}
	}
}

// A click event to signal the finish of the edit
QuickModifyTopic.prototype.modify_topic_click = function (oEvent)
{
	if (this.bInEditMode && !this.bMouseOnDiv)
		this.modify_topic_save(smf_session_id, smf_session_var);
}

// Moved out of the editing div
QuickModifyTopic.prototype.modify_topic_mouseout = function (oEvent)
{
	this.bMouseOnDiv = false;
}

// Moved back over the editing div
QuickModifyTopic.prototype.modify_topic_mouseover = function (oEvent)
{
	this.bMouseOnDiv = true;
}

// *** QuickReply object.
function QuickReply(oOptions)
{
	this.opt = oOptions;
	this.bCollapsed = this.opt.bDefaultCollapsed;
	this.bIsFull = this.opt.bIsFull;
}

// When a user presses quote, put it in the quick reply box (if expanded).
QuickReply.prototype.quote = function (iMessageId, xDeprecated)
{
	// Compatibility with older templates.
	if (typeof(xDeprecated) != 'undefined')
		return true;

	if (this.bCollapsed)
	{
		window.location.href = smf_prepareScriptUrl(this.opt.sScriptUrl) + 'action=post;quote=' + iMessageId + ';topic=' + this.opt.iTopicId + '.' + this.opt.iStart;
		return false;
	}
	else
	{
		// Doing it the XMLhttp way?
		if (window.XMLHttpRequest)
		{
			ajax_indicator(true);
			if (this.bIsFull)
				insertQuoteFast(iMessageId);
			else
				getXMLDocument(smf_prepareScriptUrl(this.opt.sScriptUrl) + 'action=quotefast;quote=' + iMessageId + ';xml', this.onQuoteReceived);
		}
		// Or with a smart popup!
		else
			reqWin(smf_prepareScriptUrl(this.opt.sScriptUrl) + 'action=quotefast;quote=' + iMessageId, 240, 90);

		// Move the view to the quick reply box.
		if (navigator.appName == 'Microsoft Internet Explorer')
			window.location.hash = this.opt.sJumpAnchor;
		else
			window.location.hash = '#' + this.opt.sJumpAnchor;

		return false;
	}
}

// This is the callback function used after the XMLhttp request.
QuickReply.prototype.onQuoteReceived = function (oXMLDoc)
{
	var sQuoteText = '';

	for (var i = 0; i < oXMLDoc.getElementsByTagName('quote')[0].childNodes.length; i++)
		sQuoteText += oXMLDoc.getElementsByTagName('quote')[0].childNodes[i].nodeValue;

	replaceText(sQuoteText, document.forms.postmodify.message);

	ajax_indicator(false);
}

// The function handling the swapping of the quick reply.
QuickReply.prototype.swap = function ()
{
	document.getElementById(this.opt.sImageId).src = this.opt.sImagesUrl + "/" + (this.bCollapsed ? this.opt.sImageCollapsed : this.opt.sImageExpanded);
	$('#' + this.opt.sContainerId).slideToggle();

	this.bCollapsed = !this.bCollapsed;
}

// *** QuickModify object.
function QuickModify(oOptions)
{
	this.opt = oOptions;
	this.bInEditMode = false;
	this.sCurMessageId = '';
	this.oCurMessageDiv = null;
	this.oCurInfoDiv = null;
	this.oCurSubjectDiv = null;
	this.oMsgIcon = null
	this.sMessageBuffer = '';
	this.sSubjectBuffer = '';
	this.sInfoBuffer = '';
	this.bXmlHttpCapable = this.isXmlHttpCapable();
	this.aAccessKeys = new Array();

	// Show the edit buttons
	if (this.bXmlHttpCapable)
	{
		var aShowQuickModify = document.getElementsByClassName(this.opt.sClassName);
		for (var i = 0, length = aShowQuickModify.length; i < length; i++) {
			aShowQuickModify[i].style.display = "inline";
		}
	}
}

// Determine whether the quick modify can actually be used.
QuickModify.prototype.isXmlHttpCapable = function ()
{
	if (typeof(window.XMLHttpRequest) == 'undefined')
		return false;

	// Opera didn't always support POST requests. So test it first.
	if ('opera' in window)
	{
		var oTest = new XMLHttpRequest();
		if (!('setRequestHeader' in oTest))
			return false;
	}

	return true;
}

// Function called when a user presses the edit button.
QuickModify.prototype.modifyMsg = function (iMessageId)
{
	if (!this.bXmlHttpCapable)
		return;

	// Add backwards compatibility with old themes.
	if (typeof(sSessionVar) == 'undefined')
		sSessionVar = 'sesc';

	// Removes the accesskeys from the quickreply inputs and saves them in an array to use them later
	if (typeof(this.opt.sFormRemoveAccessKeys) != 'undefined')
	{
		if (typeof(document.forms[this.opt.sFormRemoveAccessKeys]))
		{
			var aInputs = document.forms[this.opt.sFormRemoveAccessKeys].getElementsByTagName('input');
			for (var i = 0; i < aInputs.length; i++)
			{
				if (aInputs[i].accessKey != '')
				{
					this.aAccessKeys[aInputs[i].name] = aInputs[i].accessKey;
					aInputs[i].accessKey = '';
				}
			}
		}
	}

	// First cancel if there's another message still being edited.
	if (this.bInEditMode)
		this.modifyCancel();

	// At least NOW we're in edit mode
	this.bInEditMode = true;

	// Send out the XMLhttp request to get more info
	ajax_indicator(true);
	sendXMLDocument.call(this, smf_prepareScriptUrl(smf_scripturl) + 'action=quotefast;quote=' + iMessageId + ';modify;xml', '', this.onMessageReceived);
}

// The callback function used for the XMLhttp request retrieving the message.
QuickModify.prototype.onMessageReceived = function (XMLDoc)
{
	var sBodyText = '', sSubjectText = '';

	// No longer show the 'loading...' sign.
	ajax_indicator(false);

	// Grab the message ID.
	this.sCurMessageId = XMLDoc.getElementsByTagName('message')[0].getAttribute('id');

	// Show the message icon if it was hidden and its set
	if (this.opt.sIconHide !== null)
	{
		this.oMsgIcon = document.getElementById('messageicon_' + this.sCurMessageId.replace("msg_", ""));
		if (this.oMsgIcon !== null && this.oMsgIcon.style.display === 'none')
			this.oMsgIcon.style.display = '';
	}

	// If this is not valid then simply give up.
	if (!document.getElementById(this.sCurMessageId))
		return this.modifyCancel();

	// Replace the body part.
	for (var i = 0; i < XMLDoc.getElementsByTagName("message")[0].childNodes.length; i++)
		sBodyText += XMLDoc.getElementsByTagName("message")[0].childNodes[i].nodeValue;

	this.oCurMessageDiv = document.getElementById(this.sCurMessageId);
	this.sMessageBuffer = getInnerHTML(this.oCurMessageDiv);

	// We have to force the body to lose its dollar signs thanks to IE.
	sBodyText = sBodyText.replace(/\$/g, '{&dollarfix;$}');

	// Actually create the content, with a bodge for disappearing dollar signs.
	setInnerHTML(this.oCurMessageDiv, this.opt.sTemplateBodyEdit.replace(/%msg_id%/g, this.sCurMessageId.substr(4)).replace(/%body%/, sBodyText).replace(/\{&dollarfix;\$\}/g, '$'));

	// Save and hide the existing subject div
	if (this.opt.sIDSubject !== null)
	{
		this.oCurSubjectDiv = document.getElementById(this.opt.sIDSubject + this.sCurMessageId.substr(4));
		if (this.oCurSubjectDiv !== null)
		{
			this.oCurSubjectDiv.style.display = 'none';
			this.sSubjectBuffer = getInnerHTML(this.oCurSubjectDiv);
		}
	}

	// Save the info div, then open an input field on it
	sSubjectText = XMLDoc.getElementsByTagName('subject')[0].childNodes[0].nodeValue.replace(/\$/g, '{&dollarfix;$}');
	if (this.opt.sIDInfo !== null)
	{
		this.oCurInfoDiv = document.getElementById(this.opt.sIDInfo + this.sCurMessageId.substr(4));
		if (this.oCurInfoDiv !== null)
		{
			this.sInfoBuffer = getInnerHTML(this.oCurInfoDiv);
			setInnerHTML(this.oCurInfoDiv, this.opt.sTemplateSubjectEdit.replace(/%subject%/, sSubjectText).replace(/\{&dollarfix;\$\}/g, '$'));
		}
	}

	// position the editor in the window
	location.hash = '#info_' + this.sCurMessageId.substr(this.sCurMessageId.lastIndexOf("_") + 1);

	return true;
}

// Function in case the user presses cancel (or other circumstances cause it).
QuickModify.prototype.modifyCancel = function ()
{
	// Roll back the HTML to its original state.
	if (this.oCurMessageDiv)
	{
		setInnerHTML(this.oCurMessageDiv, this.sMessageBuffer);
		setInnerHTML(this.oCurInfoDiv, this.sInfoBuffer);
		setInnerHTML(this.oCurSubjectDiv, this.sSubjectBuffer);
		if (this.oCurSubjectDiv !== null)
		{
			this.oCurSubjectDiv.style.display = '';
		}
	}

	// Hide the message icon if we are doing that
	if (this.opt.sIconHide)
	{
		var oCurrentMsgIcon = document.getElementById('msg_icon_' + this.sCurMessageId.replace("msg_", ""));
		if (oCurrentMsgIcon !== null && oCurrentMsgIcon.src.indexOf(this.opt.sIconHide) > 0)
			this.oMsgIcon.style.display = 'none';
	}

	// No longer in edit mode, that's right.
	this.bInEditMode = false;

	// Let's put back the accesskeys to their original place
	if (typeof(this.opt.sFormRemoveAccessKeys) != 'undefined')
	{
		if (typeof(document.forms[this.opt.sFormRemoveAccessKeys]))
		{
			var aInputs = document.forms[this.opt.sFormRemoveAccessKeys].getElementsByTagName('input');
			for (var i = 0; i < aInputs.length; i++)
			{
				if (typeof(this.aAccessKeys[aInputs[i].name]) != 'undefined')
				{
					aInputs[i].name = this.aAccessKeys[aInputs[i].name];
				}
			}
		}
	}

	return false;
}

// The function called after a user wants to save his precious message.
QuickModify.prototype.modifySave = function (sSessionId, sSessionVar)
{
	// We cannot save if we weren't in edit mode.
	if (!this.bInEditMode)
		return true;

	// Add backwards compatibility with old themes.
	if (typeof(sSessionVar) == 'undefined')
		sSessionVar = 'sesc';

	// Let's put back the accesskeys to their original place
	if (typeof(this.opt.sFormRemoveAccessKeys) != 'undefined')
	{
		if (typeof(document.forms[this.opt.sFormRemoveAccessKeys]))
		{
			var aInputs = document.forms[this.opt.sFormRemoveAccessKeys].getElementsByTagName('input');
			for (var i = 0; i < aInputs.length; i++)
			{
				if (typeof(this.aAccessKeys[aInputs[i].name]) != 'undefined')
				{
					aInputs[i].name = this.aAccessKeys[aInputs[i].name];
				}
			}
		}
	}

	var i, x = new Array();
	x[x.length] = 'subject=' + escape(document.forms.quickModForm['subject'].value.replace(/&#/g, "&#38;#").php_to8bit()).replace(/\+/g, "%2B");
	x[x.length] = 'message=' + escape(document.forms.quickModForm['message'].value.replace(/&#/g, "&#38;#").php_to8bit()).replace(/\+/g, "%2B");
	x[x.length] = 'topic=' + parseInt(document.forms.quickModForm.elements['topic'].value);
	x[x.length] = 'msg=' + parseInt(document.forms.quickModForm.elements['msg'].value);

	// Send in the XMLhttp request and let's hope for the best.
	ajax_indicator(true);
	sendXMLDocument.call(this, smf_prepareScriptUrl(this.opt.sScriptUrl) + "action=jsmodify;topic=" + this.opt.iTopicId + ";" + smf_session_var + "=" + smf_session_id + ";xml", x.join("&"), this.onModifyDone);

	return false;
}

// Callback function of the XMLhttp request sending the modified message.
QuickModify.prototype.onModifyDone = function (XMLDoc)
{
	// We've finished the loading stuff.
	ajax_indicator(false);

	// If we didn't get a valid document, just cancel.
	if (!XMLDoc || !XMLDoc.getElementsByTagName('smf')[0])
	{
		// Mozilla will nicely tell us what's wrong.
		if (XMLDoc.childNodes.length > 0 && XMLDoc.firstChild.nodeName == 'parsererror')
		{
			var oErrordiv = document.getElementById('error_box');
			setInnerHTML(oErrordiv, XMLDoc.firstChild.textContent);
			oErrordiv.style.display = '';
		}
		else
			this.modifyCancel();
		return;
	}

	var message = XMLDoc.getElementsByTagName('smf')[0].getElementsByTagName('message')[0];
	var body = message.getElementsByTagName('body')[0];
	var error = message.getElementsByTagName('error')[0];

	if (body)
	{
		// Show new body.
		var bodyText = '';
		for (var i = 0; i < body.childNodes.length; i++)
			bodyText += body.childNodes[i].nodeValue;

		this.sMessageBuffer = this.opt.sTemplateBodyNormal.replace(/%body%/, bodyText.replace(/\$/g, '{&dollarfix;$}')).replace(/\{&dollarfix;\$\}/g,'$');
		setInnerHTML(this.oCurMessageDiv, this.sMessageBuffer);

		// Show new subject div, update in case it changed
		var oSubject = message.getElementsByTagName('subject')[0];
		var sSubjectText = oSubject.childNodes[0].nodeValue.replace(/\$/g, '{&dollarfix;$}');
		this.sSubjectBuffer = this.opt.sTemplateSubjectNormal.replace(/%subject%/, sSubjectText).replace(/\{&dollarfix;\$\}/g, '$');
		setInnerHTML(this.oCurSubjectDiv, this.sSubjectBuffer);
		this.oCurSubjectDiv.style.display = '';

		// Restore the info bar div
		setInnerHTML(this.oCurInfoDiv, this.sInfoBuffer);

		// Show this message as 'modified on x by y'.
		if (this.opt.bShowModify)
			setInnerHTML(document.getElementById('modified_' + this.sCurMessageId.substr(4)), message.getElementsByTagName('modified')[0].childNodes[0].nodeValue);

		// Hide the icon if we were told to
		if (this.opt.sIconHide !== null)
		{
			var oCurrentMsgIcon = document.getElementById('msg_icon_' + this.sCurMessageId.replace("msg_", ""));
			if (oCurrentMsgIcon !== null && oCurrentMsgIcon.src.indexOf(this.opt.sIconHide) > 0)
				this.oMsgIcon.style.display = 'none';
		}
	}
	else if (error)
	{
		var oErrordiv = document.getElementById('error_box');
		setInnerHTML(oErrordiv, error.childNodes[0].nodeValue);
		oErrordiv.style.display = '';
		document.forms.quickModForm.message.style.border = error.getAttribute('in_body') == '1' ? this.opt.sErrorBorderStyle : '';
		document.forms.quickModForm.subject.style.border = error.getAttribute('in_subject') == '1' ? this.opt.sErrorBorderStyle : '';
	}
}

function InTopicModeration(oOptions)
{
	this.opt = oOptions;
	this.bButtonsShown = false;
	this.iNumSelected = 0;

	// Add backwards compatibility with old themes.
	if (typeof(this.opt.sSessionVar) == 'undefined')
		this.opt.sSessionVar = 'sesc';

	this.init();
}

InTopicModeration.prototype.init = function()
{
	// Add checkboxes to all the messages.
	for (var i = 0, n = this.opt.aMessageIds.length; i < n; i++)
	{
		// Create the checkbox.
		var oCheckbox = document.createElement('input');
		oCheckbox.type = 'checkbox';
		oCheckbox.className = 'input_check';
		oCheckbox.name = 'msgs[]';
		oCheckbox.value = this.opt.aMessageIds[i];
		oCheckbox.instanceRef = this;
		oCheckbox.onclick = function () {
			this.instanceRef.handleClick(this);
		}

		// Append it to the container
		var oCheckboxContainer = document.getElementById(this.opt.sCheckboxContainerMask + this.opt.aMessageIds[i]);
		oCheckboxContainer.appendChild(oCheckbox);
		oCheckboxContainer.style.display = '';
	}
}

InTopicModeration.prototype.handleClick = function(oCheckbox)
{
	if (!this.bButtonsShown && this.opt.sButtonStripDisplay)
	{
		var oButtonStrip = document.getElementById(this.opt.sButtonStrip);
		var oButtonStripDisplay = document.getElementById(this.opt.sButtonStripDisplay);

		// Make sure it can go somewhere.
		if (typeof(oButtonStripDisplay) == 'object' && oButtonStripDisplay != null)
			oButtonStripDisplay.style.display = "";
		else
		{
			var oNewDiv = document.createElement('div');
			var oNewList = document.createElement('ul');

			oNewDiv.id = this.opt.sButtonStripDisplay;
			oNewDiv.className = this.opt.sButtonStripClass ? this.opt.sButtonStripClass : 'buttonlist floatbottom';

			oNewDiv.appendChild(oNewList);
			oButtonStrip.appendChild(oNewDiv);
		}

		// Add the 'remove selected items' button.
		if (this.opt.bCanRemove)
			smf_addButton(this.opt.sButtonStrip, this.opt.bUseImageButton, {
				sId: this.opt.sSelf + '_remove_button',
				sText: this.opt.sRemoveButtonLabel,
				sImage: this.opt.sRemoveButtonImage,
				sUrl: '#',
				sCustom: ' onclick="return ' + this.opt.sSelf + '.handleSubmit(\'remove\')"'
			});

		// Add the 'restore selected items' button.
		if (this.opt.bCanRestore)
			smf_addButton(this.opt.sButtonStrip, this.opt.bUseImageButton, {
				sId: this.opt.sSelf + '_restore_button',
				sText: this.opt.sRestoreButtonLabel,
				sImage: this.opt.sRestoreButtonImage,
				sUrl: '#',
				sCustom: ' onclick="return ' + this.opt.sSelf + '.handleSubmit(\'restore\')"'
			});

		// Add the 'split selected items' button.
		if (this.opt.bCanSplit)
			smf_addButton(this.opt.sButtonStrip, this.opt.bUseImageButton, {
				sId: this.opt.sSelf + '_split_button',
				sText: this.opt.sSplitButtonLabel,
				sImage: this.opt.sSplitButtonImage,
				sUrl: '#',
				sCustom: ' onclick="return ' + this.opt.sSelf + '.handleSubmit(\'split\')"'
			});

		// Adding these buttons once should be enough.
		this.bButtonsShown = true;
	}

	// Keep stats on how many items were selected.
	this.iNumSelected += oCheckbox.checked ? 1 : -1;

	// Show the number of messages selected in the button.
	if (this.opt.bCanRemove && !this.opt.bUseImageButton)
	{
		setInnerHTML(document.getElementById(this.opt.sSelf + '_remove_button_text'), this.opt.sRemoveButtonLabel + ' [' + this.iNumSelected + ']');
		document.getElementById(this.opt.sSelf + '_remove_button').style.display = this.iNumSelected < 1 ? "none" : "";
	}

	if (this.opt.bCanRestore && !this.opt.bUseImageButton)
	{
		setInnerHTML(document.getElementById(this.opt.sSelf + '_restore_button_text'), this.opt.sRestoreButtonLabel + ' [' + this.iNumSelected + ']');
		document.getElementById(this.opt.sSelf + '_restore_button').style.display = this.iNumSelected < 1 ? "none" : "";
	}

	if (this.opt.bCanSplit && !this.opt.bUseImageButton)
	{
		setInnerHTML(document.getElementById(this.opt.sSelf + '_split_button_text'), this.opt.sSplitButtonLabel + ' [' + this.iNumSelected + ']');
		document.getElementById(this.opt.sSelf + '_split_button').style.display = this.iNumSelected < 1 ? "none" : "";
	}

	// Try to restore the correct position.
	var aItems = document.getElementById(this.opt.sButtonStrip).getElementsByTagName('span');
	if (aItems.length > 3)
	{
		if (this.iNumSelected < 1)
		{
			aItems[aItems.length - 3].className = aItems[aItems.length - 3].className.replace(/\s*position_holder/, 'last');
			aItems[aItems.length - 2].className = aItems[aItems.length - 2].className.replace(/\s*position_holder/, 'last');
		}
		else
		{
			aItems[aItems.length - 2].className = aItems[aItems.length - 2].className.replace(/\s*last/, 'position_holder');
			aItems[aItems.length - 3].className = aItems[aItems.length - 3].className.replace(/\s*last/, 'position_holder');
		}
	}
}

InTopicModeration.prototype.handleSubmit = function (sSubmitType)
{
	var oForm = document.getElementById(this.opt.sFormId);

	// Make sure this form isn't submitted in another way than this function.
	var oInput = document.createElement('input');
	oInput.type = 'hidden';
	oInput.name = this.opt.sSessionVar;
	oInput.value = this.opt.sSessionId;
	oForm.appendChild(oInput);

	switch (sSubmitType)
	{
		case 'remove':
			if (!confirm(this.opt.sRemoveButtonConfirm))
				return false;

			oForm.action = oForm.action.replace(/;split_selection=1/, '');
			oForm.action = oForm.action.replace(/;restore_selected=1/, '');
		break;

		case 'restore':
			if (!confirm(this.opt.sRestoreButtonConfirm))
				return false;

			oForm.action = oForm.action.replace(/;split_selection=1/, '');
			oForm.action = oForm.action + ';restore_selected=1';
		break;

		case 'split':
			if (!confirm(this.opt.sRestoreButtonConfirm))
				return false;

			oForm.action = oForm.action.replace(/;restore_selected=1/, '');
			oForm.action = oForm.action + ';split_selection=1';
		break;

		default:
			return false;
		break;
	}

	oForm.submit();
	return true;
}


// *** Other functions...
function expandThumb(thumbID)
{
	var img = document.getElementById('thumb_' + thumbID);
	var link = document.getElementById('link_' + thumbID);

	// save the currently displayed image attributes
	var tmp_src = img.src;
	var tmp_height = img.style.height;
	var tmp_width = img.style.width;

	// set the displayed image attributes to the link attributes, this will expand in place
	img.src = link.href;
	img.style.width = link.style.width;
	img.style.height = link.style.height;

	// place the image attributes back
	link.href = tmp_src;
	link.style.width = tmp_width;
	link.style.height = tmp_height;

	return false;
}

function ignore_toggles(msgids, text)
{
	for (i = 0; i < msgids.length; i++)
	{
		var msgid = msgids[i];
		new smc_Toggle({
			bToggleEnabled: true,
			bCurrentlyCollapsed: true,
			aSwappableContainers: [
				'msg_' + msgid + '_extra_info',
				'msg_' + msgid,
				'msg_' + msgid + '_footer',
				'msg_' + msgid + '_quick_mod',
				'modify_button_' + msgid,
				'msg_' + msgid + '_signature'
			],
			aSwapLinks: [
				{
					sId: 'msg_' + msgid + '_ignored_link',
					msgExpanded: '',
					msgCollapsed: text
				}
			]
		});
	}
}