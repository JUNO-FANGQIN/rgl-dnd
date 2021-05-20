import isEqual from 'lodash.isequal';
import React, { PureComponent, SyntheticEvent } from 'react';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import { prefixCls } from '../constants';
import { ItemProps, ItemStates, Size } from '../types';
import { calcGridItemPosition, calcWH, getWH, setTransform } from '../utils';
import Draggable from './Draggable';

type ResizeEventType = 'onResizeStart' | 'onResize' | 'onResizeStop';

const getPositionParams = (props: ItemProps) => {
  const { margin, containerPadding, cols, containerWidth, rowHeight, maxRows } = props;

  return {
    margin,
    containerPadding,
    cols,
    containerWidth,
    rowHeight,
    maxRows,
  };
};
const getPosition = (props: ItemProps, state: ItemStates) => {
  const { data } = props;
  const positionParams = getPositionParams(props);
  const position = calcGridItemPosition(positionParams, data.x, data.y, data.w, data.h, state);

  return setTransform(position);
};

export default class Item extends PureComponent<ItemProps, ItemStates> {
  state: ItemStates = {
    resizing: null,
    node: null,
  };

  componentDidMount() {
    this.setState({
      node: this.renderItem(),
    });
  }

  componentDidUpdate(prevProps: ItemProps) {
    const { isDragging } = this.props;

    if (isDragging) {
      return;
    }

    if (!this.state.node || !isEqual(this.pickProps(prevProps), this.pickProps(this.props))) {
      this.setState({
        node: this.renderItem(),
      });
    }
  }

  pickProps(props: ItemProps) {
    const { data } = props;

    return {
      data,
      ...getPositionParams(props),
    };
  }

  setResizing(resizing: Size) {
    this.setState({ resizing });
  }

  handleResize = (
    e: SyntheticEvent,
    callbackData: ResizeCallbackData,
    evtType: ResizeEventType
  ) => {
    const { data } = this.props;
    const { size } = callbackData;
    const positionParams = getPositionParams(this.props);
    let { w, h } = calcWH(positionParams, size.width, size.height, data.x, data.y);
    const item = {
      ...data,
      w,
      h,
    };
    const wh = getWH(item, positionParams);

    e.preventDefault();
    e.stopPropagation();

    this.setResizing(evtType === 'onResizeStop' ? null : size);
    this.props[evtType]?.(data, wh.w, wh.h);
  };

  onResizeStart = (e: SyntheticEvent, callbackData: ResizeCallbackData) => {
    this.handleResize(e, callbackData, 'onResizeStart');
  };
  onResize = (e: SyntheticEvent, callbackData: ResizeCallbackData) => {
    this.handleResize(e, callbackData, 'onResize');
  };
  onResizeStop = (e: SyntheticEvent, callbackData: ResizeCallbackData) => {
    this.handleResize(e, callbackData, 'onResizeStop');
  };

  renderItem() {
    const { renderItem, data } = this.props;

    return renderItem(data);
  }

  render() {
    const {
      type,
      style,
      data,
      resizeHandles,
      children,
      onDragStart,
      onDragEnd,
      className = '',
      margin,
      cols,
      containerWidth,
      containerPadding,
      rowHeight,
      maxRows,
      renderItem,
      isDragging,
      placeholder,
      ...restProps
    } = this.props;
    const { resizing, node } = this.state;
    const position = getPosition(this.props, this.state);
    const _style: any = { style: { ...style, ...position, ...resizing } };

    return (
      <ResizableBox
        {...restProps}
        {..._style}
        width={position.width}
        height={position.height}
        onResizeStart={this.onResizeStart}
        onResize={this.onResize}
        onResizeStop={this.onResizeStop}
        resizeHandles={resizeHandles}
        className={`${prefixCls}-item${placeholder ? '-placeholder' : ''} ${className}`.trim()}
      >
        <Draggable
          type={type}
          data={data}
          draggable={data.static !== true}
          onDragEnd={onDragEnd}
          onDragStart={onDragStart}
        >
          {node}
        </Draggable>
      </ResizableBox>
    );
  }
}
