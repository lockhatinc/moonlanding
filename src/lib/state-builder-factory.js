export class StateBuilder {
  constructor(initialState = {}) {
    this.state = initialState;
    this.transitions = {};
    this.validators = {};
    this.subscribers = [];
  }

  addTransition(fromState, toState, predicate = () => true) {
    if (!this.transitions[fromState]) this.transitions[fromState] = [];
    this.transitions[fromState].push({ to: toState, predicate });
    return this;
  }

  addValidator(state, validator) {
    if (!this.validators[state]) this.validators[state] = [];
    this.validators[state].push(validator);
    return this;
  }

  can(fromState, toState) {
    const allowed = this.transitions[fromState]?.find(t => t.to === toState);
    return allowed ? allowed.predicate() : false;
  }

  async transition(toState, context = {}) {
    const currentState = this.state.current;
    if (!this.can(currentState, toState)) {
      throw new Error(`Cannot transition from ${currentState} to ${toState}`);
    }

    const validators = this.validators[toState] || [];
    for (const validator of validators) {
      const result = await validator(context);
      if (!result.valid) throw new Error(`Validation failed: ${result.error}`);
    }

    this.state = { ...this.state, current: toState, previous: currentState, transitionedAt: Date.now(), context };
    this.notifySubscribers();
    return this.state;
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  notifySubscribers() {
    this.subscribers.forEach(cb => cb(this.state));
  }

  getState() {
    return { ...this.state };
  }

  reset() {
    this.state = { current: this.state.initial || 'idle' };
    this.notifySubscribers();
    return this.state;
  }
}

export function createStateBuilder(config = {}) {
  const { initial = 'idle', states = {}, validators = {} } = config;

  const builder = new StateBuilder({ current: initial, initial });

  Object.entries(states).forEach(([fromState, allowed]) => {
    allowed.forEach(toState => {
      builder.addTransition(fromState, toState);
    });
  });

  Object.entries(validators).forEach(([state, validator]) => {
    builder.addValidator(state, validator);
  });

  return builder;
}

export function createReducer(builder) {
  return (state, action) => {
    const { type, payload } = action;
    if (builder.can(state.current, type)) {
      return { ...state, current: type, payload, updated: Date.now() };
    }
    console.warn(`Invalid transition: ${state.current} -> ${type}`);
    return state;
  };
}

export function createAsyncReducer(builder) {
  return async (state, action) => {
    const { type, payload } = action;
    if (builder.can(state.current, type)) {
      const validators = builder.validators[type] || [];
      for (const validator of validators) {
        const result = await validator(payload);
        if (!result.valid) throw new Error(`Validation failed: ${result.error}`);
      }
      return { ...state, current: type, payload, updated: Date.now() };
    }
    throw new Error(`Invalid transition: ${state.current} -> ${type}`);
  };
}
