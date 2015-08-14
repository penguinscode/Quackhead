/*
  Source code for this project is freely available at https://github.com/penguinscode/Quackhead
*/

var duckDemoDiv, fileInput, tileHolder, duckTexture, addTeamButton;
var teams = [];
var modPackData = {
  "team": "        Teams.core.teams.Add(new Team(\"TEAMNAME\", Mod.GetPath<SMODNAME>(\"FILENAMENOEXT\"), false, false, new Vec2()));\n",
  "modcs": "using DuckGame;\n\nnamespace DuckGame.SMODNAME\n{\n    public class SMODNAME : Mod\n    {\n      protected override void OnPostInitialize()\n      {\nTEAMCODE\n        base.OnPostInitialize();\n      }\n    }\n  }\n",
  "asminfocs": "using System.Reflection;\n\n[assembly: AssemblyTitle(\"MODNAME\")]\n[assembly: AssemblyCompany(\"MODAUTHOR\")]\n[assembly: AssemblyDescription(\"MODDESC\")]\n[assembly: AssemblyVersion(\"MODVER\")]\n",
  "modconf": "<Mod>\n\n</Mod>\n"
}

var key = fromStr(atob("8xaYIAH0em9hKg0CEw8t5g=="));
var hatMagicNo = fromStr(atob("dd550H5uAQA="));

function init() {
  addTeamButton = document.getElementById("addteambutton");
  fileInput = document.getElementById("fileInput");

  addTeamButton.addEventListener("click", function(e) {
    fileInput.click();
    e.preventDefault();
  });

  fileInput.onchange = function() {
    if (this.files == null) {
      return;
    }
    handleFiles(this.files);
    this.value = null;
  }

  document.body.addEventListener("dragover", handleDragOver, false);
  document.body.addEventListener("drop", handleDrop, false);

  document.getElementById("exportasmodpackbutton").addEventListener("click", function(e) {
    var meb = document.getElementById("modexportbox");
    if (meb.style.display == "none") {
      meb.style.display = "";
    } else {
      meb.style.display = "none";
    }
  })


  document.getElementById("exportashatfilesbutton").addEventListener("click", function(e) {
    exportHatFiles();
  })

  document.getElementById("downloadmodpackbtn").addEventListener("click", function(e) {
    var modname = document.getElementById("modnamebox").value;
    var moddesc = document.getElementById("moddescbox").value;
    var modauthor = document.getElementById("modauthorbox").value;
    var modver = document.getElementById("modverbox").value;
    exportModpack(modname, moddesc, modauthor, modver);
    e.preventDefault();
  });

  PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;
  duckDemoDiv = document.getElementById("teambox");
  duckDemoDiv.parentNode.removeChild(duckDemoDiv);
  tileHolder = document.getElementById("teamboxcontainer");
  duckTexture = PIXI.Texture.fromImage("image/ducks.png");
  requestAnimationFrame(animate);
}

function handleDragOver(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect = "copy";
}

function handleDrop(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    var files = evt.dataTransfer.files;
    handleFiles(files);
}

function handleFiles(files) {
  for (var i = 0, f; f = files[i]; i++) {
    if (f.size > 7168) {
      errorMessage("'" + f.name + "' has a file size of over 7KiB. If the total hat size exceeds 8KiB, things will break. This file has been skipped. Try opening and saving it using Paint.NET to reduce the file size. Also ensure it's a 32x32 or 64x32 png image.");
      continue;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
      var data = e.target.result;
      var hatTexture = PIXI.Texture.fromImage(data);
      createTile(hatTexture, data);
    };
    reader.readAsDataURL(f);
  }
}

function errorMessage(errorText) {
  console.error(errorText);
  document.getElementById("errorbox").style.display = "";
}

function createTile(tex, data) {
  var tile = duckDemoDiv.cloneNode(true);
  var stage = new PIXI.Container();
  stage.scale.x = 5;
  stage.scale.y = 5;
  var renderer = new PIXI.CanvasRenderer(355, 195);
  renderer.backgroundColor = 0xff00ff;
  tile.children[0].appendChild(renderer.view);
  var duck = new PIXI.Sprite(duckTexture);
  var hatContaine, hatContainer = new PIXI.Container();
  stage.addChild(duck);
  stage.addChild(hatContainer);
  var team = {
    tile: tile,
    renderer: renderer,
    stage: stage,
    texture: tex,
    data: data,
    ready: false
  };
  tile.children[0].children[1].addEventListener("click", function(e) {
    teams.splice(teams.indexOf(team), 1);
    tile.remove();
  });
  demoHat(team, tex, hatContainer);
  teams.push(team);
  tileHolder.appendChild(tile);
}

function demoHat(team, texture, hatContainer) {
  var hat = new PIXI.Sprite(texture);
  hatContainer.removeChildren();
  hatContainer.addChild(hat);
  if (texture.width == 32) { // single-frame
    var hatq = new PIXI.Sprite(texture);
    hatq.position.x = 32;
    hatContainer.addChild(hatq);
    team.ready = true;
  } else if (texture.width == 0) { // Wait for update
    texture.once("update", function() {
      demoHat(team, texture, hatContainer);
    });
  } else {
    team.ready = true;
  }
}

function animate() {
    teams.forEach(animateTeam)
    requestAnimationFrame(animate);
}

function animateTeam(team) {
  if (team.renderer) {
    team.renderer.render(team.stage);
  }
}

function makeSafeName(name) {
  var newName = "";
  var nextUpper = true;
  for (var i = 0, len = name.length; i < len; i++) {
    var c = name[i].toUpperCase();
    var x = c.charCodeAt(0);
    if ((x < 65 || x > 90) && (x < 48 || x > 57)) {
      if (x == 32) {
        nextUpper = true;
      }
    } else {
      if (nextUpper) {
        nextUpper = false;
      } else {
        c = c.toLowerCase();
      }
      newName += c;
    }
  }
  return newName;
}

function dataURLToBase64(dataURL) {
  return dataURL.substring(dataURL.indexOf(",") + 1);
}

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace);
}

function exportModpack(name, desc, author, ver) {
  var sName = makeSafeName(name);
  var zip = new JSZip();
  var modFolder = zip.folder(sName)
  var contentFolder = modFolder.folder("content");
  var teamCode = "";
  teams.forEach(function(team) {
    var teamLine = modPackData.team;
    var teamName = team.tile.children[0].children[0].value;
    var fName = makeSafeName(teamName).toLowerCase();
    teamLine = replaceAll(teamLine, "TEAMNAME", teamName);
    teamLine = replaceAll(teamLine, "SMODNAME", sName);
    teamLine = replaceAll(teamLine, "FILENAMENOEXT", fName);
    contentFolder.file(fName + ".png", dataURLToBase64(team.data), {base64: true});
    teamCode += teamLine;
  });
  modFolder.file("mod.conf", modPackData.modconf);
  var modcs = modPackData.modcs;
  modcs = replaceAll(modcs, "SMODNAME", sName);
  modcs = replaceAll(modcs, "TEAMCODE", teamCode);
  modFolder.file("Mod.cs", modcs);
  var asm = modPackData.asminfocs;
  asm = replaceAll(asm, "MODNAME", name);
  asm = replaceAll(asm, "MODDESC", desc);
  asm = replaceAll(asm, "MODAUTHOR", author);
  asm = replaceAll(asm, "MODVER", ver);
  modFolder.file("AssemblyInfo.cs", asm);
  var zipDL = zip.generate({type:"blob"});
  saveAs(zipDL, sName + ".zip");
}

function generateIV() {
  var iv = new Array(16);
  for (var i = 0; i < iv.length; i++) {
    iv[i] = Math.floor(Math.random() * 256);
  }
  return iv;
}

function toStr(bytes) {
  var str = "";
  for (var i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(parseInt(bytes[i]));
  }
  return str;
}

function fromStr(str) {
  var bytes = [];
  for (var i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i));
  }
  return bytes;
}

function getIntBytes( x ){
    var bytes = [];
    var i = 4;
    do {
    bytes[--i] = x & (255);
    x = x>>8;
    } while ( i )
    return bytes.reverse();
}

function generateHatFile(team) {
  var iv = generateIV();
  var xIV = toStr(iv);
  var encData = [];
  encData = encData.concat(hatMagicNo);
  var teamBytes = fromStr(team.tile.children[0].children[0].value);
  encData = encData.concat([teamBytes.length]);
  encData = encData.concat(teamBytes);
  var imageBytes = fromStr(atob(dataURLToBase64(team.data)));
  encData = encData.concat(getIntBytes(imageBytes.length));
  encData = encData.concat(imageBytes);
  var saveData = [];
  var ivlen = iv.length;
  saveData = saveData.concat(getIntBytes(iv.length));
  saveData = saveData.concat(iv);
  saveData = saveData.concat(doEncrypt(encData, iv, key));
  return saveData;
}

function blobbify(data, type) {
  return new Blob([new Uint8Array(data)], {type: type});
}

function doEncrypt(message, iv, key) {
  return slowAES.encrypt(message,
      2,
      key,
      iv);
}

function exportHatFiles() {
  if (teams.length == 0) {
    return;
  } else if (teams.length == 1) {
    var team = teams[0];
    var hat = blobbify(generateHatFile(team), "application/octet-stream");
    var sName = makeSafeName(team.tile.children[0].children[0].value);
    saveAs(hat, sName + ".hat");
  } else {
    var zip = new JSZip();
    teams.forEach(function(team) {
      var hat = generateHatFile(team);
      var sName = makeSafeName(team.tile.children[0].children[0].value);
      zip.file(sName + ".hat", btoa(toStr(hat)), {base64: true});
    });
    var zipDL = zip.generate({type:"blob"});
    saveAs(zipDL, "hats.zip");
  }
}

window.onload = init;
