import React from 'react';
import { shape, string, number, func, arrayOf } from 'prop-types';
import { noop } from 'lodash';
import TextField from '@material-ui/core/TextField';
import { AddCircleOutline, DeleteOutlined, DragHandleOutlined } from '@material-ui/icons';
import useSortable from '../../hooks/useSortable';

const type = "items"

export default function ListItems({ value, onChange }) {
  const swapBlock = React.useCallback((from, to) => {
    onChange({
      name: type, value: value.map((valueBlock, index) => {
        if (index === from) {
          return value[to];
        }
        if (index === to) {
          return value[from];
        }
        return valueBlock;
      })
    })
  }, [value])

  const addBlock = React.useCallback((index) => {
    onChange({
      name: type, value: [
        ...value.slice(0, index + 1),
        { value: `option-${(new Date()).getTime()}`, id: (new Date()).getTime() },
        ...value.slice(index + 1)
      ]
    })
  }, []);

  const removeBlock = React.useCallback((index) => {
    onChange({ name: type, value: value.filter((_, vIndex) => vIndex !== index) })
  }, []);

  const updateBlock = React.useCallback((index, newValue) => {
    onChange({
      name: type, value: value.map((blockValue, blockIndex) => {
        if (blockIndex !== index) {
          return blockValue;
        }
        return {
          ...blockValue,
          value: newValue
        }
      })
    })
  }, [])

  return (
    <div className="list-items-container">
      <label>Field Items</label>
      <div>
        {
          value.map((block, index) => (
            <Item
              key={block.id}
              block={block}
              index={index}
              swapBlock={swapBlock}
              addBlock={addBlock}
              removeBlock={removeBlock}
              updateBlock={updateBlock}
            />
          ))
        }

      </div>
    </div>
  )
}

ListItems.propTypes = {
  value: arrayOf(shape({
    id: string,
  })),
  onChange: func
}

ListItems.defaultProps = {
  onChange: noop
}

const Item = function Item({
  block,
  index,
  swapBlock,
  addBlock,
  removeBlock,
  updateBlock
}) {
  const dropRef = React.createRef();

  const [
    { isDragging },
    drag,
    preview,
    drop,
  ] = useSortable(index, type, dropRef, addBlock, swapBlock);

  const handleChange = React.useCallback(
    (e) => updateBlock(index, e.target.value),
    [index]
  )

  const handleAdd = React.useCallback(() => addBlock(index), [index]);
  const handleRemove = React.useCallback(() => removeBlock(index), [index]);

  return drop(preview(
    <div ref={dropRef} className="item-container" style={(isDragging) ? { opacity: 0 } : {}}>
      <TextField
        label={`Option-${index + 1}`}
        variant="outlined"
        value={block.value}
        onChange={handleChange}
        fullWidth
      />
      <div ref={drag}>
        <DragHandleOutlined className="preview-icon" />
      </div>
      <AddCircleOutline onClick={handleAdd} className="preview-icon" />
      <DeleteOutlined onClick={handleRemove} className="preview-icon" />
    </div>
  ))
}

Item.propTypes = {
  block: shape({
    value: string,
  }),
  index: number,
  swapBlock: func,
  addBlock: func,
  removeBlock: func
}