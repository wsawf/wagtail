import { Controller } from '@hotwired/stimulus';

/**
 * Adds ability to sync the value or interactions with one input with one
 * or more targeted other inputs.
 *
 * @example
 * <section>
 *   <input type="text" name="title" id="title" />
 *   <input
 *     type="date"
 *     id="event-date"
 *     name="event-date"
 *     value="2025-07-22"
 *     data-controller="w-sync"
 *     data-action="change->w-sync#apply cut->w-sync#clear focus->w-sync#check"
 *     data-w-sync-target-value="#title"
 *   />
 * </section>
 */
export class SyncController extends Controller<HTMLInputElement> {
  static values = {
    delay: { default: 0, type: Number },
    disabled: { default: false, type: Boolean },
    quiet: { default: false, type: Boolean },
    target: String,
  };

  declare delayValue: number;
  declare disabledValue: boolean;
  declare quietValue: boolean;
  declare readonly targetValue: string;

  /**
   * Dispatches an event to all target elements so that they can be notified
   * that a sync has started, allowing them to disable the sync by preventing
   * default.
   */
  connect() {
    this.processTargetElements('start', true);
  }

  /**
   * Allows for targeted elements to determine, via preventing the default event,
   * whether this sync controller should be disabled.
   */
  check() {
    this.processTargetElements('check', true);
  }

  /**
   * Applies a value from the controlled element to the targeted
   * elements.
   */
  apply() {
    this.processTargetElements('apply').forEach((target) => {
      setTimeout(() => {
        target.setAttribute('value', this.element.value);

        if (this.quietValue) return;
        this.dispatch('change', {
          cancelable: false,
          prefix: '',
          target: target as HTMLInputElement,
        });
      }, this.delayValue);
    });
  }

  /**
   * Clears the value of the targeted elements.
   */
  clear() {
    this.processTargetElements('clear').forEach((target) => {
      setTimeout(() => {
        target.setAttribute('value', '');
        if (this.quietValue) return;
        this.dispatch('change', {
          cancelable: false,
          prefix: '',
          target: target as HTMLInputElement,
        });
      }, this.delayValue);
    });
  }

  /**
   * Simple method to dispatch a ping event to the targeted elements.
   */
  ping() {
    this.processTargetElements('ping', false, { bubbles: true });
  }

  /**
   * Returns the non-default prevented elements that are targets of this sync
   * controller. Additionally allows this processing to enable or disable
   * this controller instance's sync behaviour.
   */
  processTargetElements(
    eventName: string,
    resetDisabledValue = false,
    options = {},
  ) {
    if (!resetDisabledValue && this.disabledValue) {
      return [];
    }

    const targetElements = [
      ...document.querySelectorAll<HTMLElement>(this.targetValue),
    ];

    const elements = targetElements.filter((target) => {
      const event = this.dispatch(eventName, {
        bubbles: false,
        cancelable: true,
        ...options, // allow overriding some options but not detail & target
        detail: { element: this.element, value: this.element.value },
        target: target as HTMLInputElement,
      });

      return !event.defaultPrevented;
    });

    if (resetDisabledValue) {
      this.disabledValue = targetElements.length > elements.length;
    }

    return elements;
  }
}
