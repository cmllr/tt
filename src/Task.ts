class Task {
  private _startTime: Date;
  private _endTime?: Date | null;
  private _title: string;
  private _remarks?: string | null;
  constructor(startTime: Date, title: string) {
    this._startTime = startTime;
    this._title = title;
  }
  toString(): string {
    return `${this._title} since ${this._startTime.toTimeString()}`;
  }
  endTask(endTime: Date, remarks: string) {
    this._endTime = endTime;
    this._remarks = remarks;
  }
  getTitle(): string {
    return this._title;
  }
  getStartTime(): Date {
    return this._startTime;
  }
  getEndTime(): Date | null | undefined {
    return this._endTime;
  }
  getRemarks(): string | null | undefined{
    return this._remarks;
  }
}

export default Task;