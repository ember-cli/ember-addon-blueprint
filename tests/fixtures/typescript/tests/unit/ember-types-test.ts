import { tracked, cached } from '@glimmer/tracking';
import Component from '@glimmer/component';
import Route from '@ember/routing/route';
import { uniqueId } from '@ember/utils';

export const everythingHasTypes = {
  tracked, cached, Component, Route, uniqueId
}
