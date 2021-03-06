/**
 * floor.js
 * 
 * Javascript code executed by renderer thread on floor window
 * Binds HTML interface to main thread functionality
 * 
 * Author: Antonio Fiol-Mahon
 */

'use strict';

const electron = require('electron');
const viewtool = require('../public/viewtool.js');

const CLASS_CONTAINER = 'list-group-item list-group-item-action flex-column align-items-start';

// Load appList from main launcher thread
var appList = electron.ipcRenderer.sendSync('get-app-list', undefined);

var launcher_list = []; // List of app_ids in launcher
var index_selected = 0; // Current selection in launcher_list

/**
 * Syles the list element corresponding to the appDescriptor in apps at index
 * @param {number} index - index of the app in apps to style
 * @param {number} index_selected - the currently selected list index
 */
function styleElement(app_id, is_selected) {
  // Get the element for the app at index
  let el = document.getElementById(`app_${app_id}`);
  let group = appList[app_id]['group'];
  if (is_selected) {
    el.setAttribute('class', CLASS_CONTAINER + ` ${viewtool.getGroupSelectClass(group)}`);
  } else {
    el.setAttribute('class', CLASS_CONTAINER);
    el.setAttribute('style', viewtool.getListElementStyle(group));
  }
}

/**
 * Updates the styling for all list elements and the selected app variable
 * @param {string} app_id - app_id of app that is being selected
 */
function select(app_id) {
  // Skip invalid selections
  if (app_id == undefined) {
    console.log(`Cannot select invalid app_id ${app_id}!`);
    return;
  }
  for (let i in launcher_list) {
    i = parseInt(i);
    let selected = launcher_list[i] == app_id;
    if (selected == true) {
      index_selected = i;
    }
    styleElement(launcher_list[i], selected);
  }
}

/**
 * Creates the list element for the app descriptor at the specified index
 * @param {number} app_id - app_id from applist of app to generate element for
 * @returns the DOM element constructed from the specified app descriptor
 */
function generateListElement(app_id) {
  console.log(`Generating element for app_id ${app_id}`);
  // Create list container element & add event listeners
  let name = appList[app_id]['name'];
  let description = appList[app_id]['description'];
  let group = appList[app_id]['group'];
  let listContainer = document.createElement('a');
  listContainer.id = `app_${app_id}`;
  listContainer.addEventListener('click', () => { openApp(app_id); });
  listContainer.addEventListener('mouseover', () => { select(app_id); });
  listContainer.setAttribute('class', CLASS_CONTAINER);

  // Create title display div
  let divTitle = document.createElement('div');
  divTitle.setAttribute('class', 'd-flex w-100 justify-content-between');

  // Create Title element
  let title = document.createElement('h5');
  title.setAttribute('class', 'mb-1');
  title.innerHTML = name;

  // Create Category label element
  let categoryLabel = document.createElement('small');
  let category = (group != undefined) ? group : 'default';
  categoryLabel.innerHTML = viewtool.getGroupTitle(category);

  // Create description element
  let desc = document.createElement('p');
  desc.innerHTML = description;
  desc.setAttribute('class', 'mb-1');

  // Build heirarchy and return element
  divTitle.appendChild(title);
  divTitle.appendChild(categoryLabel);
  listContainer.appendChild(divTitle);
  listContainer.appendChild(desc);
  return listContainer;
}

/**
 * Populate a div container with the provided applist
 * @param {*} list_div the html div element that will hold the list
 * @param {string[]} launcher_id_list list to populate with app ids loaded in launcher
 */
function loadAppTable(list_div, launcher_id_list) {
  for (let app_id in appList) {
    // Ignore non app values in app_list
    if (!appList.hasOwnProperty(app_id)) { continue; }

    // Add app to launcher app_id list for list attribute lookup
    launcher_id_list.push(app_id);
    
    var list_item = generateListElement(app_id);
    list_div.appendChild(list_item);
  }
  select(launcher_id_list[0]);
}

/**
 * Call the main thread to open the desired application
 * @param {sting} app_id index of app in appList.json to open
 */
function openApp(app_id) {
  electron.ipcRenderer.send('open-app', app_id);
}

// Code below is run when script is loaded

// Get most recent appList from main launcher thread and render app table
loadAppTable(document.getElementById('listDiv'), launcher_list);

// Check for keypress events from main electron thread
electron.ipcRenderer.on('keyevent', function(event, arg) {
  console.log('Key event detected!');
  if (arg == 'up') {
    console.log(`want to select index ${(index_selected + 1)}`)
    select(launcher_list[index_selected + 1]);
    if (index_selected >= 4) {
      let element_id = `app_${launcher_list[index_selected]}`
      let el = document.getElementById(element_id);
      document.getElementById('listDiv').scrollTop += el.clientHeight;
    }
  } else if (arg == 'down') {
    console.log(`want to select index ${(index_selected - 1)}`)
    select(launcher_list[index_selected - 1]);
    if (index_selected <= launcher_list.length - 5) {
      let element_id = `app_${launcher_list[index_selected]}`
      let el = document.getElementById(element_id);
      document.getElementById('listDiv').scrollTop -= el.clientHeight;
    }
  } else if (arg == 'select') {
    openApp(launcher_list[index_selected]);
  }
});

// Rotate the UI orientation when rotation events are received
electron.ipcRenderer.on('rotate-event', function(event, rotation) {
  document.getElementById('owner').setAttribute('style', `transform: rotate(${rotation}deg); transform-origin: 50% 50%;transition-duration:100ms;`);
});
