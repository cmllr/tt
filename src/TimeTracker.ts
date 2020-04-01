import { StatusBarItem, window, StatusBarAlignment, commands, ExtensionContext, Disposable, workspace, Uri, WorkspaceEdit, Position } from "vscode";
import Task from './Task';
import * as fs from "fs";
import { join } from "path";

class TimeTracker extends Disposable {
  private _statusBarIcon: StatusBarItem;
  private _context: ExtensionContext;
  private _currentTask?: Task | null;
  constructor(context: ExtensionContext) {
    super(() => { });
    this._context = context;
    this._statusBarIcon = window.createStatusBarItem(StatusBarAlignment.Left);
    this._context.subscriptions.push(this);
    this.registerCommands();
    this.updateStatus();
  }
  private registerCommands(): void {
    let startCommand = commands.registerCommand("extension.start", () => this.start());
    let stopCommand = commands.registerCommand("extension.stop", () => this.stop());
    let listCommand = commands.registerCommand("extension.list", () => this.listTasks());
    this._context.subscriptions.push(listCommand);
    this._context.subscriptions.push(startCommand);
    this._context.subscriptions.push(stopCommand);
  }
  public async stopTask(comment: string) {
    if (!this._currentTask) {
      return;
    }
    this._currentTask.endTask(new Date(), comment);
    // Write task info
    if (!fs.existsSync(this._context.globalStoragePath)) {
      fs.mkdirSync(this._context.globalStoragePath);
    }
    let path = join(this._context.globalStoragePath, "time.csv");
    fs.appendFile(path, `${this._currentTask.getStartTime()};${this._currentTask.getEndTime()};${this._currentTask.getTitle()};${this._currentTask.getRemarks()}\n`, function (err: any) {
      if (err) {
        return console.error(err);
      }
      console.log("File created!");
    });

    this._currentTask = null;


    this.updateStatus();
  }
  public async stop() {
    let result = await window.showInputBox({
      placeHolder: 'Remarks',
    });
    if (!this._currentTask) {
      return;
    }
    let comment = "";
    if (result) {
      comment = result;
    }
    this.stopTask(comment);
  }
  public async start() {
    const result = await window.showInputBox({
      placeHolder: 'New task description',
    });
    if (!result) {
      return;
    }
    if (this._currentTask) {
      // end current task
    }
    this._currentTask = new Task(new Date(), result);
    this.updateStatus();
  }
  public updateStatus(): void {
    if (this._currentTask) {
      this._statusBarIcon.text = "$(clock) " + this._currentTask?.toString();
    } else {
      this._statusBarIcon.text = "$(circle-slash) " + "No Task";
    }
    this._statusBarIcon.show();
  }
  private getDurationText(seconds: number): string {
    if (seconds === 0) {
      return "No time";
    }
    let minutes = seconds/ 60;
    let hours = minutes / 60;
    return this.round(hours).toString();
  }
  private round(value: number) : number {
    return Math.round((value + Number.EPSILON) * 100) / 100
  }
  
  private listTasks(): void {
    let tasks = this.getTasks();
    let textContent = "";
    let taskMap: { [title: string]: number; } = {};
    let dayMap: { [date: string]: number; } = {};
    tasks.forEach(task => {
      if (task.getEndTime()) {
        let endTime = task.getEndTime();
        let title = task.getTitle();
        let date = task.getStartTime().toDateString();
        if (endTime && title) {
          let duration = (endTime.getTime() - task.getStartTime().getTime()) / 1000
          let isNew = Object.keys(taskMap).indexOf(title) === -1;
          let isNewDay = Object.keys(dayMap).indexOf(date) === -1;
          if (isNew) {
            taskMap[title] = duration;
          } else {
            taskMap[title] += duration;
          }
          if (isNewDay) {
            dayMap[date] = duration;
          } else {
            dayMap[date] += duration;
          }
        }
      }
    });
    textContent += "Per task\n========\n";
    Object.keys(taskMap).forEach(key => {
      let value = taskMap[key];
      textContent += key + " " + this.getDurationText(value) + "\n";
    });
    // Sort days
    let orderedDays: { [title: string]: number; } = {};
    Object.keys(dayMap).sort().forEach(function(key) {
      orderedDays[key] = dayMap[key];
    });

    textContent += "\nPer day\n=======\n";
    Object.keys(orderedDays).forEach(key => {
      let value = orderedDays[key];
      textContent += key + " " + this.getDurationText(value) + "\n";
    });
    const newFile = Uri.parse('untitled:' + join('Times.txt'));
    workspace.openTextDocument(newFile).then(document => {
      const edit = new WorkspaceEdit();
      edit.insert(newFile, new Position(0, 0), textContent);
      return workspace.applyEdit(edit).then(success => {
        if (success) {
          window.showTextDocument(document);
        } else {
          window.showInformationMessage('Error!');
        }
      });
    });
  }
  private getTasks(): Task[] {
    let tasks: Task[] = [];

    let path = join(this._context.globalStoragePath, "time.csv");
    let contents = fs.readFileSync(path, 'utf8');
    let lines = contents.split("\n");
    lines.forEach(function (line) {
      let parts = line.split(";");
      // CSV Structure: BeginDateTime;EndDateTime;Title;Comments
      let task = new Task(new Date(Date.parse(parts[0])), parts[2]);
      task.endTask(new Date(Date.parse(parts[1])), parts[3]);
      tasks.push(task);
    });
    return tasks;
  }
}

export default TimeTracker;