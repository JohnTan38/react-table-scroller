import { getType } from 'typesafe-actions';

import { TableScrollerState } from '../models';
import { actions, initialState, TableScrollerActions } from './';
import { getBoundingRect, getColumnPositions, getInnerTable } from '../helpers';

export function tableScrollerReducer(state: TableScrollerState, action: TableScrollerActions): TableScrollerState {

    switch (action.type) {

        case getType(actions.updateMainWrapperElem):
        case getType(actions.updateContentWrapperElem):
        case getType(actions.updateScrollbarElem): {
            const { elem, elemName } = action.payload;

            const elements = {
                ...state.elements,
                [elemName]: elem
            };
            const rects = getRects(elements);
            return {
                ...initialState,
                visibleContentPercentage: getVisibleContentPercentage(rects),
                elements,
                rects
            };
        }

        case getType(actions.scrollStart): {
            const { width: scrollbarWidth } = state.rects.scrollbar!;

            const handlerWidth = scrollbarWidth * state.visibleContentPercentage;
            const activeScrollWidth = scrollbarWidth - handlerWidth;
            const handlerPosition = {
                x: activeScrollWidth * state.scrollPositionPercentage,
                y: 0 // TODO: handle vertical scroll as well
            };

            const { mousePosition } = action.payload;

            return {
                ...state,
                isScrolling: true,
                mousePosOnScrollStart: mousePosition,
                handlerPosOnScrollStart: handlerPosition
            };
        }

        case getType(actions.scrollMove): {
            const { width: scrollbarWidth } = state.rects.scrollbar!;

            const handlerWidth = scrollbarWidth * state.visibleContentPercentage;
            const activeScrollWidth = scrollbarWidth - handlerWidth;
            const clampPosition = (position: number) =>
                Math.min(activeScrollWidth, Math.max(0, position));

            const mouseDistanceSinceStart = action.payload.mousePositionAbsolute.x - state.mousePosOnScrollStart!.x;
            const handlerPosition = clampPosition(state.handlerPosOnScrollStart!.x + mouseDistanceSinceStart);
            const scrollPositionPercentage = handlerPosition / activeScrollWidth;
            const scrollPositionPx = Math.round((state.rects.contentWrapper!.width - state.rects.mainWrapper!.width) * scrollPositionPercentage);

            return {
                ...state,
                scrollPositionPercentage,
                scrollPositionPx,
                handlerOffset: handlerPosition
            };
        }

        case getType(actions.scrollEnd): {
            return {
                ...state,
                isScrolling: false,
                mousePosOnScrollStart: null,
                handlerPosOnScrollStart: null
            };
        }
    }
    
    return  state;
}

function getRects(elems: TableScrollerState['elements']): TableScrollerState['rects'] {
    return {
        mainWrapper: elems.mainWrapper && getBoundingRect(elems.mainWrapper),
        contentWrapper: elems.contentWrapper && getBoundingRect(elems.contentWrapper),
        scrollbar: elems.scrollbar && getBoundingRect(elems.scrollbar),
    };
}

function getVisibleContentPercentage(rects: TableScrollerState['rects']): number {
    return rects.mainWrapper && rects.contentWrapper
        ? Math.min(1, rects.mainWrapper.width / rects.contentWrapper.width)
        : 0;
}
