import React from 'react';

import Typography from '@material-ui/core/Typography';

import { createMount } from '@material-ui/core/test-utils';

import SearchPill from './';

let mount;
beforeAll(() => {
  mount = createMount();
});

describe('SearchPill', function() {
  it('renders labels correctly', function() {
    const label = 'hello world';

    const wrapper = mount(
      <SearchPill engineCategoryIcon={'icon-transcription'} label={label} />
    );

    expect(wrapper.find(Typography).text()).toEqual(label);
  });

  it('renders the background color correctly', function() {
    const wrapper = mount(
      <SearchPill engineCategoryIcon={'icon-transcription'} label={'label'} />
    );

    expect(wrapper.find('.searchPillBackgroundColor')).toHaveLength(1);
  });

  it('renders excluded pills with a different color', function() {
    const wrapper = mount(
      <SearchPill
        engineCategoryIcon={'icon-transcription'}
        label={'label'}
        exclude
      />
    );

    expect(wrapper.find('.searchPillExcludeBackgroundColor')).toHaveLength(1);
  });

  it('renders pills with the selected color over the excluded color', function() {
    const wrapper = mount(
      <SearchPill
        engineCategoryIcon={'icon-transcription'}
        label={'label'}
        exclude
        selected
      />
    );

    expect(wrapper.find('.searchPillSelectedBackgroundColor')).toHaveLength(1);
    expect(wrapper.find('.searchPillExcludeBackgroundColor')).toHaveLength(0);
  });

  it('displays highlighted backgroundColor precedence over excluded backgroundColor', function() {
    const wrapper = mount(
      <SearchPill
        engineCategoryIcon={'icon-transcription'}
        label={'label'}
        exclude
        highlighted
      />
    );

    expect(wrapper.find('.searchPillHighlightedBackgroundColor')).toHaveLength(
      1
    );
    expect(wrapper.find('.searchPillExcludeBackgroundColor')).toHaveLength(0);
  });

  it('expects onClick to be called', function() {
    const onClick = jest.fn();
    let wrapper = mount(
      <SearchPill
        engineCategoryIcon={'icon-transcription'}
        label={'label'}
        exclude
        highlighted
        onClick={onClick}
      />
    );

    wrapper.find(SearchPill).simulate('click');
    expect(onClick).toHaveBeenCalled();
  });

  it('expects onDelete to be called and onClick to not be called', function() {
    const onClick = jest.fn();
    const onDelete = jest.fn();
    let wrapper = mount(
      <SearchPill
        engineCategoryIcon={'icon-transcription'}
        label={'label'}
        exclude
        highlighted
        onClick={onClick}
        onDelete={onDelete}
      />
    );

    wrapper.find('[data-attribute="deletePill"]').simulate('click');
    expect(onClick).not.toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalled();
  });
});
